import { randomUUID } from "node:crypto";
import { pool, type Queryable } from "@/db/pool";
import { getTaskProjectIdForMember, isProjectMember } from "@/lib/accessModels";
import { BACKLOG_STAGE_NAME } from "@/features/project/types/project.types";
import { applyTaskPlacement } from "@/features/taskCycles/model/taskCyclesModels";
import { ASSIGNEES_SQL, stageJson, taskColumns } from "./taskColumns";
import type {
	CreateTaskInput,
	CreateTaskResult,
	CycleTaskItem,
	Task,
	TaskItem,
	UpdateTaskFields,
	UpdateTaskResult,
} from "../types/tasks.types";

const hasTypeInProject = async (
	db: Queryable,
	projectId: string,
	typeId: string,
) => {
	const { rowCount } = await db.query(
		`SELECT 1 FROM project_types WHERE project_id = $1 AND type_id = $2`,
		[projectId, typeId],
	);
	return (rowCount ?? 0) > 0;
};

// assignee_ids is a plain TEXT[] (no FK), so membership is enforced here.
const areProjectMembers = async (
	db: Queryable,
	projectId: string,
	ids: string[],
) => {
	if (ids.length === 0) return true;

	const { rows } = await db.query<{ n: number }>(
		`SELECT count(*)::int AS n FROM project_members
		 WHERE project_id = $1 AND user_id = ANY($2::text[])`,
		[projectId, ids],
	);
	return rows[0].n === ids.length;
};

export async function createTask(
	userId: string,
	input: CreateTaskInput,
): Promise<CreateTaskResult> {
	const client = await pool.connect();
	let transactionStarted = false;

	try {
		await client.query("BEGIN");
		transactionStarted = true;

		if (!(await isProjectMember(input.projectId, userId, client))) {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return { status: "project_not_found" };
		}

		if (!(await hasTypeInProject(client, input.projectId, input.typeId))) {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return { status: "type_not_in_project" };
		}

		if (
			!(await areProjectMembers(
				client,
				input.projectId,
				input.assigneeIds ?? [],
			))
		) {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return { status: "invalid_assignees" };
		}

		const now = Date.now();

		// Atomic counter bump: no read-modify-write, and the row lock serializes task creation.
		const counter = await client.query<{ key: string; taskNumber: number }>(
			`UPDATE projects
			 SET next_task_number = next_task_number + 1, updated_at = $2
			 WHERE id = $1
			 RETURNING key, next_task_number - 1 AS "taskNumber"`,
			[input.projectId, now],
		);
		const { key, taskNumber } = counter.rows[0];

		const taskId = randomUUID();

		await client.query(
			`INSERT INTO tasks
			   (id, project_id, key, type_id, name, description, assignee_ids,
			    due_date, tags, is_backlog, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7::text[], $8::date, $9::text[], TRUE, $10, $10)`,
			[
				taskId,
				input.projectId,
				`${key}-${String(taskNumber).padStart(3, "0")}`,
				input.typeId,
				input.name,
				input.description ?? "",
				input.assigneeIds ?? [],
				input.dueDate ?? null,
				input.tags ?? [],
				now,
			],
		);

		let task: Task;

		if (input.cycle) {
			// Cycle placement goes through the same validation as every move.
			const placement = await applyTaskPlacement(
				client,
				userId,
				taskId,
				null,
				{
					type: "cycle",
					cycleId: input.cycle.id,
					stageId: input.cycle.stageId,
				},
				now,
			);

			if (placement.status !== "ok") {
				await client.query("ROLLBACK");
				transactionStarted = false;
				return placement;
			}

			task = placement.task;
		} else {
			const created = await client.query<Task>(
				`SELECT ${taskColumns()} FROM tasks WHERE id = $1`,
				[taskId],
			);
			task = created.rows[0];
		}

		await client.query("COMMIT");
		transactionStarted = false;

		return { status: "ok", task };
	} catch (error) {
		if (transactionStarted) {
			await client
				.query("ROLLBACK")
				.catch((e) =>
					console.error("Failed to roll back task creation:", e),
				);
		}
		throw error;
	} finally {
		client.release();
	}
}

// Single UPDATE statement, so no transaction is needed.
export async function updateTask(
	userId: string,
	id: string,
	updates: UpdateTaskFields,
): Promise<UpdateTaskResult> {
	const projectId = await getTaskProjectIdForMember(id, userId);
	if (!projectId) return { status: "task_not_found" };

	if (
		updates.typeId !== undefined &&
		!(await hasTypeInProject(pool, projectId, updates.typeId))
	) {
		return { status: "type_not_in_project" };
	}

	if (
		updates.assigneeIds !== undefined &&
		!(await areProjectMembers(pool, projectId, updates.assigneeIds))
	) {
		return { status: "invalid_assignees" };
	}

	// Column names come from this fixed whitelist, never from the client.
	const sets: string[] = [];
	const values: unknown[] = [id];
	const add = (column: string, value: unknown, cast = "") => {
		values.push(value);
		sets.push(`${column} = $${values.length}${cast}`);
	};

	if (updates.name !== undefined) add("name", updates.name);
	if (updates.description !== undefined)
		add("description", updates.description);
	if (updates.assigneeIds !== undefined)
		add("assignee_ids", updates.assigneeIds, "::text[]");
	if (updates.dueDate !== undefined)
		add("due_date", updates.dueDate, "::date");
	if (updates.tags !== undefined) add("tags", updates.tags, "::text[]");
	if (updates.typeId !== undefined) add("type_id", updates.typeId);
	add("updated_at", Date.now());

	const { rows } = await pool.query<Task>(
		`UPDATE tasks SET ${sets.join(", ")} WHERE id = $1 RETURNING ${taskColumns()}`,
		values,
	);

	if (!rows[0]) return { status: "task_not_found" };

	return { status: "ok", task: rows[0] };
}

// Every task with its current stage. A task can be in several cycles; its current stage
// comes from its most recently updated task_cycle. Backlog tasks get the Backlog stage.
export async function getAllTasksByProject(
	projectId: string,
): Promise<TaskItem[]> {
	const { rows } = await pool.query<TaskItem>(
		`SELECT ${taskColumns("t")}, ${ASSIGNEES_SQL},
		        CASE WHEN t.is_backlog THEN ${stageJson("bs")} ELSE ${stageJson("cs")} END AS stage
		 FROM tasks t
		 JOIN project_stages bs ON bs.project_id = t.project_id AND bs.name = $2
		 LEFT JOIN LATERAL (
		   SELECT ps.* FROM task_cycles tc
		   JOIN project_stages ps ON ps.id = tc.stage_id
		   WHERE tc.task_id = t.id
		   ORDER BY tc.updated_at DESC, tc.created_at DESC, tc.id DESC
		   LIMIT 1
		 ) cs ON TRUE
		 WHERE t.project_id = $1 AND (t.is_backlog OR cs.id IS NOT NULL)
		 ORDER BY t.created_at ASC`,
		[projectId, BACKLOG_STAGE_NAME],
	);
	return rows;
}

export async function getBacklogTasksByProject(
	projectId: string,
): Promise<CycleTaskItem[]> {
	const { rows } = await pool.query<CycleTaskItem>(
		`SELECT ${taskColumns("t")}, ${ASSIGNEES_SQL}, ${stageJson("bs")} AS stage,
		        '' AS "taskCycleId", '' AS "cycleId"
		 FROM tasks t
		 JOIN project_stages bs ON bs.project_id = t.project_id AND bs.name = $2
		 WHERE t.project_id = $1 AND t.is_backlog
		 ORDER BY t.created_at ASC`,
		[projectId, BACKLOG_STAGE_NAME],
	);
	return rows;
}

const CYCLE_TASK_SELECT = `
	SELECT ${taskColumns("t")}, ${ASSIGNEES_SQL}, ${stageJson("ps")} AS stage,
	       tc.id AS "taskCycleId", tc.cycle_id AS "cycleId"
	FROM task_cycles tc
	JOIN tasks t ON t.id = tc.task_id
	JOIN project_stages ps ON ps.id = tc.stage_id
	JOIN cycles c ON c.id = tc.cycle_id`;

// Numeric-aware key order (ABC-2 before ABC-10)
const CYCLE_TASK_ORDER = `ORDER BY substring(t.key from '(\\d+)$')::int, tc.created_at`;

export async function getTasksByCycle(
	cycleId: string,
): Promise<CycleTaskItem[]> {
	const { rows } = await pool.query<CycleTaskItem>(
		`${CYCLE_TASK_SELECT} WHERE tc.cycle_id = $1 ${CYCLE_TASK_ORDER}`,
		[cycleId],
	);
	return rows;
}

export async function getCycleTasksByProject(
	projectId: string,
): Promise<CycleTaskItem[]> {
	const { rows } = await pool.query<CycleTaskItem>(
		`${CYCLE_TASK_SELECT} WHERE c.project_id = $1 ${CYCLE_TASK_ORDER}`,
		[projectId],
	);
	return rows;
}
