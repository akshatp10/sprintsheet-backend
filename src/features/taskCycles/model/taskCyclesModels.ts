import { randomUUID } from "node:crypto";
import { pool, type Queryable } from "@/db/pool";
import { BACKLOG_STAGE_NAME } from "@/features/project/types/project.types";
import { taskColumns } from "@/features/tasks/model/taskColumns";
import type { Task } from "@/features/tasks/types/tasks.types";
import type {
	CreateTaskCycleInput,
	CreateTaskCycleResult,
	DeleteTaskCycleResult,
	MoveTaskResult,
	MoveTasksResult,
	PlacementResult,
	TaskCycle,
	TaskDestination,
	UpdateTaskCycleStageResult,
} from "../types/taskCycles.types";

const taskCycleColumns = (alias = "") => {
	const p = alias ? `${alias}.` : "";
	return `${p}id, ${p}task_id AS "taskId", ${p}cycle_id AS "cycleId",
		${p}stage_id AS "stageId", ${p}created_at AS "createdAt", ${p}updated_at AS "updatedAt"`;
};

// Applies a placement change. Call inside a transaction (pass the client);
// it never commits or rolls back itself, the caller does based on the status.
// Backlog means the task has no task_cycles rows (and is_backlog = TRUE).
export async function applyTaskPlacement(
	client: Queryable,
	userId: string,
	taskId: string,
	fromCycleId: string | null,
	destination: TaskDestination,
	now: number,
): Promise<PlacementResult> {
	// Lock the task row (serializes concurrent moves of the same task) + membership check.
	const taskRes = await client.query<{ projectId: string }>(
		`SELECT t.project_id AS "projectId" FROM tasks t
		 WHERE t.id = $1
		   AND EXISTS (SELECT 1 FROM project_members pm
		               WHERE pm.project_id = t.project_id AND pm.user_id = $2)
		 FOR UPDATE OF t`,
		[taskId, userId],
	);
	if (!taskRes.rows[0]) return { status: "task_not_found" };
	const { projectId } = taskRes.rows[0];

	let target: { cycleId: string; stageId: string } | null = null;

	if (destination.type === "cycle") {
		const stageRes = await client.query<{
			projectId: string;
			name: string;
		}>(
			`SELECT project_id AS "projectId", name FROM project_stages WHERE id = $1`,
			[destination.stageId],
		);
		const stage = stageRes.rows[0];

		if (!stage) return { status: "stage_not_found" };
		if (stage.projectId !== projectId)
			return { status: "stage_wrong_project" };

		// The Backlog stage means actual backlog placement, not a cycle assignment.
		if (stage.name !== BACKLOG_STAGE_NAME) {
			// FOR SHARE: a concurrent cycle delete waits until this transaction finishes
			const cycleRes = await client.query<{ projectId: string }>(
				`SELECT project_id AS "projectId" FROM cycles WHERE id = $1 FOR SHARE`,
				[destination.cycleId],
			);
			const cycle = cycleRes.rows[0];

			if (!cycle) return { status: "cycle_not_found" };
			if (cycle.projectId !== projectId)
				return { status: "cycle_wrong_project" };

			target = {
				cycleId: destination.cycleId,
				stageId: destination.stageId,
			};
		}
	}

	const existing = await client.query<{ id: string; cycleId: string }>(
		`SELECT id, cycle_id AS "cycleId" FROM task_cycles WHERE task_id = $1`,
		[taskId],
	);
	const rows = existing.rows;
	const source = fromCycleId
		? rows.find((r) => r.cycleId === fromCycleId)
		: undefined;

	let taskCycle: TaskCycle | null = null;

	if (!target) {
		// Backlog: remove every cycle assignment.
		await client.query(`DELETE FROM task_cycles WHERE task_id = $1`, [
			taskId,
		]);
	} else {
		const { cycleId, stageId } = target;
		const existingTarget = rows.find((r) => r.cycleId === cycleId);

		if (existingTarget) {
			// Reuse the destination assignment, drop the source if it's a different row.
			const res = await client.query<TaskCycle>(
				`UPDATE task_cycles SET stage_id = $2, updated_at = $3
				 WHERE id = $1 RETURNING ${taskCycleColumns()}`,
				[existingTarget.id, stageId, now],
			);
			taskCycle = res.rows[0];

			if (source && source.id !== existingTarget.id) {
				await client.query(`DELETE FROM task_cycles WHERE id = $1`, [
					source.id,
				]);
			}
		} else if (source) {
			// Move the source assignment to the destination cycle.
			const res = await client.query<TaskCycle>(
				`UPDATE task_cycles SET cycle_id = $2, stage_id = $3, updated_at = $4
				 WHERE id = $1 RETURNING ${taskCycleColumns()}`,
				[source.id, cycleId, stageId, now],
			);
			taskCycle = res.rows[0];
		} else {
			// No source assignment: create a new one.
			const res = await client.query<TaskCycle>(
				`INSERT INTO task_cycles (id, task_id, cycle_id, stage_id, created_at, updated_at)
				 VALUES ($1, $2, $3, $4, $5, $5)
				 RETURNING ${taskCycleColumns()}`,
				[randomUUID(), taskId, cycleId, stageId, now],
			);
			taskCycle = res.rows[0];
		}
	}

	const taskOut = await client.query<Task>(
		`UPDATE tasks SET is_backlog = $2, updated_at = $3
		 WHERE id = $1 RETURNING ${taskColumns()}`,
		[taskId, !target, now],
	);

	return { status: "ok", task: taskOut.rows[0], taskCycle };
}

// Creates a cycle assignment, or places the task in the backlog if the stage is Backlog.
export async function createTaskCycle(
	userId: string,
	input: CreateTaskCycleInput,
): Promise<CreateTaskCycleResult> {
	const client = await pool.connect();
	let transactionStarted = false;

	try {
		await client.query("BEGIN");
		transactionStarted = true;

		const result = await applyTaskPlacement(
			client,
			userId,
			input.taskId,
			null,
			{ type: "cycle", cycleId: input.cycleId, stageId: input.stageId },
			Date.now(),
		);

		if (result.status !== "ok") {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return result;
		}

		await client.query("COMMIT");
		transactionStarted = false;

		return { status: "ok", taskCycle: result.taskCycle };
	} catch (error) {
		if (transactionStarted) {
			await client
				.query("ROLLBACK")
				.catch((e) =>
					console.error(
						"Failed to roll back task cycle creation:",
						e,
					),
				);
		}
		throw error;
	} finally {
		client.release();
	}
}

// Changes the stage within a cycle.
export async function updateTaskCycleStage(
	userId: string,
	taskCycleId: string,
	stageId: string,
): Promise<UpdateTaskCycleStageResult> {
	const access = await pool.query<{ projectId: string }>(
		`SELECT c.project_id AS "projectId"
		 FROM task_cycles tc JOIN cycles c ON c.id = tc.cycle_id
		 WHERE tc.id = $1
		   AND EXISTS (SELECT 1 FROM project_members pm
		               WHERE pm.project_id = c.project_id AND pm.user_id = $2)`,
		[taskCycleId, userId],
	);
	if (!access.rows[0]) return { status: "task_cycle_not_found" };

	const stageRes = await pool.query<{ projectId: string; name: string }>(
		`SELECT project_id AS "projectId", name FROM project_stages WHERE id = $1`,
		[stageId],
	);
	const stage = stageRes.rows[0];

	if (!stage || stage.projectId !== access.rows[0].projectId) {
		return { status: "invalid_stage" };
	}
	if (stage.name === BACKLOG_STAGE_NAME) return { status: "backlog_stage" };

	const { rows } = await pool.query<TaskCycle>(
		`UPDATE task_cycles SET stage_id = $2, updated_at = $3
		 WHERE id = $1 RETURNING ${taskCycleColumns()}`,
		[taskCycleId, stageId, Date.now()],
	);
	if (!rows[0]) return { status: "task_cycle_not_found" };

	return { status: "ok", taskCycle: rows[0] };
}

// Moves a task between cycles or into the backlog.
export async function moveTaskAcrossCycle(
	userId: string,
	taskId: string,
	fromCycleId: string | null,
	destination: TaskDestination,
): Promise<MoveTaskResult> {
	const client = await pool.connect();
	let transactionStarted = false;

	try {
		await client.query("BEGIN");
		transactionStarted = true;

		const result = await applyTaskPlacement(
			client,
			userId,
			taskId,
			fromCycleId,
			destination,
			Date.now(),
		);

		if (result.status !== "ok") {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return result;
		}

		await client.query("COMMIT");
		transactionStarted = false;

		return { status: "ok", task: result.task };
	} catch (error) {
		if (transactionStarted) {
			await client
				.query("ROLLBACK")
				.catch((e) =>
					console.error("Failed to roll back task move:", e),
				);
		}
		throw error;
	} finally {
		client.release();
	}
}

// Moves multiple tasks atomically.
export async function moveMultipleTasksAcrossCycle(
	userId: string,
	moves: { taskId: string; fromCycleId: string | null }[],
	destination: TaskDestination,
): Promise<MoveTasksResult> {
	const client = await pool.connect();
	let transactionStarted = false;

	try {
		await client.query("BEGIN");
		transactionStarted = true;

		const now = Date.now();
		const moved: Task[] = [];

		// Sorted by task id so concurrent bulk moves lock rows in the same order (no deadlocks).
		const ordered = [...moves].sort((a, b) =>
			a.taskId.localeCompare(b.taskId),
		);

		for (const { taskId, fromCycleId } of ordered) {
			const result = await applyTaskPlacement(
				client,
				userId,
				taskId,
				fromCycleId,
				destination,
				now,
			);

			if (result.status !== "ok") {
				await client.query("ROLLBACK");
				transactionStarted = false;
				return result;
			}

			moved.push(result.task);
		}

		await client.query("COMMIT");
		transactionStarted = false;

		return { status: "ok", tasks: moved };
	} catch (error) {
		if (transactionStarted) {
			await client
				.query("ROLLBACK")
				.catch((e) =>
					console.error("Failed to roll back bulk task move:", e),
				);
		}
		throw error;
	} finally {
		client.release();
	}
}

export async function getTaskCycleById(
	id: string,
	userId: string,
): Promise<TaskCycle | undefined> {
	const { rows } = await pool.query<TaskCycle>(
		`SELECT ${taskCycleColumns("tc")}
		 FROM task_cycles tc JOIN cycles c ON c.id = tc.cycle_id
		 WHERE tc.id = $1
		   AND EXISTS (SELECT 1 FROM project_members pm
		               WHERE pm.project_id = c.project_id AND pm.user_id = $2)`,
		[id, userId],
	);
	return rows[0];
}

export async function getTaskCyclesByCycle(
	cycleId: string,
): Promise<TaskCycle[]> {
	const { rows } = await pool.query<TaskCycle>(
		`SELECT ${taskCycleColumns()} FROM task_cycles WHERE cycle_id = $1`,
		[cycleId],
	);
	return rows;
}

export async function getTaskCyclesByTask(
	taskId: string,
): Promise<TaskCycle[]> {
	const { rows } = await pool.query<TaskCycle>(
		`SELECT ${taskCycleColumns()} FROM task_cycles WHERE task_id = $1`,
		[taskId],
	);
	return rows;
}

export async function getTaskCyclesByProject(
	projectId: string,
): Promise<TaskCycle[]> {
	const { rows } = await pool.query<TaskCycle>(
		`SELECT ${taskCycleColumns("tc")}
		 FROM task_cycles tc JOIN cycles c ON c.id = tc.cycle_id
		 WHERE c.project_id = $1`,
		[projectId],
	);
	return rows;
}

// taskCycleId null -> delete the task itself
// taskCycleId given -> remove the task from that cycle; backlog only if it was its last cycle
export async function deleteTaskCycle(
	userId: string,
	taskId: string,
	taskCycleId: string | null,
): Promise<DeleteTaskCycleResult> {
	const client = await pool.connect();
	let transactionStarted = false;

	try {
		await client.query("BEGIN");
		transactionStarted = true;

		// Lock the task row + membership check
		const taskRes = await client.query<{ projectId: string }>(
			`SELECT t.project_id AS "projectId" FROM tasks t
			 WHERE t.id = $1
			   AND EXISTS (SELECT 1 FROM project_members pm
			               WHERE pm.project_id = t.project_id AND pm.user_id = $2)
			 FOR UPDATE OF t`,
			[taskId, userId],
		);

		if (!taskRes.rows[0]) {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return { status: "task_not_found" };
		}

		const { projectId } = taskRes.rows[0];

		if (!taskCycleId) {
			// task_cycles rows go with it (ON DELETE CASCADE)
			await client.query(`DELETE FROM tasks WHERE id = $1`, [taskId]);

			await client.query("COMMIT");
			transactionStarted = false;

			return {
				status: "ok",
				deleted: {
					taskId,
					taskCycleId: null,
					cycleId: null,
					projectId,
				},
			};
		}

		const tc = await client.query<{ taskId: string; cycleId: string }>(
			`SELECT task_id AS "taskId", cycle_id AS "cycleId" FROM task_cycles WHERE id = $1`,
			[taskCycleId],
		);

		if (!tc.rows[0]) {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return { status: "task_cycle_not_found" };
		}

		if (tc.rows[0].taskId !== taskId) {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return { status: "task_cycle_mismatch" };
		}

		await client.query(`DELETE FROM task_cycles WHERE id = $1`, [
			taskCycleId,
		]);

		const remaining = await client.query(
			`SELECT 1 FROM task_cycles WHERE task_id = $1 LIMIT 1`,
			[taskId],
		);

		if (remaining.rowCount === 0) {
			await client.query(
				`UPDATE tasks SET is_backlog = TRUE, updated_at = $2 WHERE id = $1`,
				[taskId, Date.now()],
			);
		}

		await client.query("COMMIT");
		transactionStarted = false;

		return {
			status: "ok",
			deleted: {
				taskId,
				taskCycleId,
				cycleId: tc.rows[0].cycleId,
				projectId,
			},
		};
	} catch (error) {
		if (transactionStarted) {
			await client
				.query("ROLLBACK")
				.catch((e) =>
					console.error("Failed to roll back task cycle delete:", e),
				);
		}
		throw error;
	} finally {
		client.release();
	}
}
