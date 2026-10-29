import { randomUUID } from "node:crypto";
import { pool, type Queryable } from "@/db/pool";
import type {
	Cycle,
	CreateCycleInput,
	CreateCycleResult,
	UpdateCycleFields,
	UpdateCycleResult,
} from "../types/cycles.types";

const CYCLE_COLUMNS = `
	id, project_id AS "projectId", name,
	start_date AS "startDate", end_date AS "endDate",
	created_at AS "createdAt", updated_at AS "updatedAt"
`;

export async function isProjectMember(
	projectId: string,
	userId: string,
): Promise<boolean> {
	const { rowCount } = await pool.query(
		`SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
		[projectId, userId],
	);
	return (rowCount ?? 0) > 0;
}

const hasOverlap = async (
	db: Queryable,
	projectId: string,
	startDate: string,
	endDate: string,
	excludeCycleId?: string,
) => {
	const { rowCount } = await db.query(
		`SELECT 1 FROM cycles
		 WHERE project_id = $1
		   AND ($4::text IS NULL OR id <> $4)
		   AND start_date < $3::date
		   AND end_date > $2::date
		 LIMIT 1`,
		[projectId, startDate, endDate, excludeCycleId ?? null],
	);
	return (rowCount ?? 0) > 0;
};

export async function getCycleById(
	id: string,
	userId: string,
): Promise<Cycle | undefined> {
	const { rows } = await pool.query<Cycle>(
		`SELECT ${CYCLE_COLUMNS}
		 FROM cycles c
		 WHERE c.id = $1
		   AND EXISTS (
		     SELECT 1 FROM project_members pm
		     WHERE pm.project_id = c.project_id AND pm.user_id = $2
		   )`,
		[id, userId],
	);
	return rows[0];
}

export async function getCyclesByProject(projectId: string): Promise<Cycle[]> {
	const { rows } = await pool.query<Cycle>(
		`SELECT ${CYCLE_COLUMNS}
		 FROM cycles
		 WHERE project_id = $1
		 ORDER BY start_date ASC`,
		[projectId],
	);
	return rows;
}

export async function createCycle(
	userId: string,
	input: CreateCycleInput,
): Promise<CreateCycleResult> {
	const client = await pool.connect();
	let transactionStarted = false;

	try {
		await client.query("BEGIN");
		transactionStarted = true;

		// Lock the project row (only if the user is a member): serializes cycle
		// writes per project, so two concurrent requests can't both pass the overlap check.
		const project = await client.query(
			`SELECT p.id FROM projects p
			 WHERE p.id = $1
			   AND EXISTS (
			     SELECT 1 FROM project_members pm
			     WHERE pm.project_id = p.id AND pm.user_id = $2
			   )
			 FOR UPDATE OF p`,
			[input.projectId, userId],
		);

		if (project.rowCount === 0) {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return { status: "project_not_found" };
		}

		if (
			await hasOverlap(
				client,
				input.projectId,
				input.startDate,
				input.endDate,
			)
		) {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return { status: "overlap" };
		}

		const now = Date.now();
		const { rows } = await client.query<Cycle>(
			`INSERT INTO cycles
			   (id, project_id, name, start_date, end_date, created_at, updated_at)
			 VALUES ($1, $2, $3, $4::date, $5::date, $6, $6)
			 RETURNING ${CYCLE_COLUMNS}`,
			[
				randomUUID(),
				input.projectId,
				input.name,
				input.startDate,
				input.endDate,
				now,
			],
		);

		await client.query("COMMIT");
		transactionStarted = false;

		return { status: "ok", cycle: rows[0] };
	} catch (error) {
		if (transactionStarted) {
			try {
				await client.query("ROLLBACK");
			} catch (rollbackError) {
				console.error(
					"Failed to roll back cycle creation:",
					rollbackError,
				);
			}
		}
		throw error;
	} finally {
		client.release();
	}
}

export async function updateCycle(
	userId: string,
	id: string,
	updates: UpdateCycleFields,
): Promise<UpdateCycleResult> {
	const client = await pool.connect();
	let transactionStarted = false;

	try {
		await client.query("BEGIN");
		transactionStarted = true;

		// 1. Find the cycle's project (membership enforced). project_id never changes.
		const access = await client.query<{ projectId: string }>(
			`SELECT c.project_id AS "projectId"
			 FROM cycles c
			 WHERE c.id = $1
			   AND EXISTS (
			     SELECT 1 FROM project_members pm
			     WHERE pm.project_id = c.project_id AND pm.user_id = $2
			   )`,
			[id, userId],
		);

		if (access.rowCount === 0) {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return { status: "not_found" };
		}

		const { projectId } = access.rows[0];

		// 2. Lock the project, then read the cycle fresh (new statement = new snapshot)
		await client.query(`SELECT id FROM projects WHERE id = $1 FOR UPDATE`, [
			projectId,
		]);

		const current = await client.query<Cycle>(
			`SELECT ${CYCLE_COLUMNS} FROM cycles WHERE id = $1`,
			[id],
		);

		if (current.rowCount === 0) {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return { status: "not_found" };
		}

		const existing = current.rows[0];
		const name = updates.name || existing.name;
		const startDate = updates.startDate || existing.startDate;
		const endDate = updates.endDate || existing.endDate;

		// 3. Validate the merged dates; only re-check overlap if a date changed
		if (startDate >= endDate) {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return { status: "invalid_dates" };
		}

		const datesChanged =
			startDate !== existing.startDate || endDate !== existing.endDate;

		if (
			datesChanged &&
			(await hasOverlap(client, projectId, startDate, endDate, id))
		) {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return { status: "overlap" };
		}

		// 4. Update
		const { rows } = await client.query<Cycle>(
			`UPDATE cycles
			 SET name = $2, start_date = $3::date, end_date = $4::date, updated_at = $5
			 WHERE id = $1
			 RETURNING ${CYCLE_COLUMNS}`,
			[id, name, startDate, endDate, Date.now()],
		);

		await client.query("COMMIT");
		transactionStarted = false;

		return { status: "ok", cycle: rows[0] };
	} catch (error) {
		if (transactionStarted) {
			try {
				await client.query("ROLLBACK");
			} catch (rollbackError) {
				console.error(
					"Failed to roll back cycle update:",
					rollbackError,
				);
			}
		}
		throw error;
	} finally {
		client.release();
	}
}
