import type { Task } from "@/features/tasks/types/tasks.types";

export interface TaskCycle {
	id: string;
	taskId: string;
	cycleId: string;
	stageId: string;
	createdAt: number;
	updatedAt: number;
}

export type TaskDestination =
	| { type: "backlog" }
	| { type: "cycle"; cycleId: string; stageId: string };

export interface CreateTaskCycleInput {
	taskId: string;
	cycleId: string;
	stageId: string;
}

export interface MoveTaskInput {
	taskId: string;
	fromCycleId: string | null; // null = from backlog
	to: TaskDestination;
}

export interface MoveTasksInput {
	tasks: { taskId: string; fromCycleId: string | null }[];
	to: TaskDestination;
}

export interface DeleteTaskCycleResponse {
	taskId: string;
	taskCycleId: string | null;
	cycleId: string | null;
	projectId: string;
}

// Model results
export type PlacementFailure =
	| { status: "task_not_found" }
	| { status: "stage_not_found" }
	| { status: "stage_wrong_project" }
	| { status: "cycle_not_found" }
	| { status: "cycle_wrong_project" };

export type PlacementResult =
	| { status: "ok"; task: Task; taskCycle: TaskCycle | null }
	| PlacementFailure;

export type CreateTaskCycleResult =
	| { status: "ok"; taskCycle: TaskCycle | null }
	| PlacementFailure;

export type MoveTaskResult = { status: "ok"; task: Task } | PlacementFailure;

export type MoveTasksResult =
	| { status: "ok"; tasks: Task[] }
	| PlacementFailure;

export type UpdateTaskCycleStageResult =
	| { status: "ok"; taskCycle: TaskCycle }
	| { status: "task_cycle_not_found" }
	| { status: "invalid_stage" }
	| { status: "backlog_stage" };

export type DeleteTaskCycleResult =
	| { status: "ok"; deleted: DeleteTaskCycleResponse }
	| { status: "task_not_found" }
	| { status: "task_cycle_not_found" }
	| { status: "task_cycle_mismatch" };
