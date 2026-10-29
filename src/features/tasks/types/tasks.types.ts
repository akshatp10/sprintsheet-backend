import type { ProjectStage } from "@/features/stages/types/stages.types";
import type { UserSummary } from "@/features/users/types/users.types";
import type { PlacementFailure } from "@/features/taskCycles/types/taskCycles.types";

export interface Task {
	id: string;
	key: string;
	projectId: string;
	typeId: string;
	name: string;
	description: string;
	assigneeIds: string[];
	dueDate: string | null;
	tags: string[];
	isBacklog: 0 | 1;
	createdAt: number;
	updatedAt: number;
}

export interface TaskItem extends Task {
	stage: ProjectStage;
	assignees: UserSummary[];
}

export interface CycleTaskItem extends TaskItem {
	taskCycleId: string;
	cycleId: string;
}

export interface CreateTaskInput {
	projectId: string;
	name: string;
	description?: string;
	assigneeIds?: string[];
	dueDate?: string | null;
	typeId: string;
	tags?: string[];
	cycle?: { id: string; stageId: string };
}

export type UpdateTaskFields = Partial<
	Pick<
		Task,
		"name" | "description" | "assigneeIds" | "dueDate" | "tags" | "typeId"
	>
>;

export interface UpdateTaskInput {
	id: string;
	updates: UpdateTaskFields;
}

// Model results
export type CreateTaskResult =
	| { status: "ok"; task: Task }
	| { status: "project_not_found" }
	| { status: "type_not_in_project" }
	| { status: "invalid_assignees" }
	| PlacementFailure;

export type UpdateTaskResult =
	| { status: "ok"; task: Task }
	| { status: "task_not_found" }
	| { status: "type_not_in_project" }
	| { status: "invalid_assignees" };
