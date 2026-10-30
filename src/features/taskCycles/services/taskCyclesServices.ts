import { AppError } from "@/utils/appError";
import { isNonEmptyString } from "@/lib/validation";
import {
	getCycleProjectIdForMember,
	getTaskProjectIdForMember,
	isProjectMember,
} from "@/lib/accessModels";
import {
	createTaskCycle,
	deleteTaskCycle,
	getTaskCycleById,
	getTaskCyclesByCycle,
	getTaskCyclesByProject,
	getTaskCyclesByTask,
	moveMultipleTasksAcrossCycle,
	moveTaskAcrossCycle,
	updateTaskCycleStage,
} from "../model/taskCyclesModels";
import type {
	CreateTaskCycleInput,
	MoveTaskInput,
	MoveTasksInput,
	PlacementFailure,
	TaskDestination,
} from "../types/taskCycles.types";

const requireId = (value: unknown, label: string): string => {
	if (!isNonEmptyString(value))
		throw new AppError(400, `${label} is required`);
	return value;
};

const parseFromCycleId = (value: unknown): string | null => {
	if (value === null || value === undefined) return null;
	return requireId(value, "fromCycleId");
};

const parseDestination = (to: any): TaskDestination => {
	if (to?.type === "backlog") return { type: "backlog" };

	if (to?.type === "cycle") {
		return {
			type: "cycle",
			cycleId: requireId(to.cycleId, "Destination cycleId"),
			stageId: requireId(to.stageId, "Destination stageId"),
		};
	}

	throw new AppError(400, "Invalid destination");
};

// Shared with the task service (create-with-cycle uses the same placement)
export const placementError = (
	status: PlacementFailure["status"],
): AppError => {
	switch (status) {
		case "task_not_found":
			return new AppError(404, "Task not found");
		case "stage_not_found":
			return new AppError(404, "Project stage not found");
		case "stage_wrong_project":
			return new AppError(400, "Stage does not belong to this project");
		case "cycle_not_found":
			return new AppError(404, "Cycle not found");
		case "cycle_wrong_project":
			return new AppError(400, "Cycle does not belong to this project");
	}
};

export async function createTaskCycleService(
	userId: string,
	input: CreateTaskCycleInput,
) {
	const result = await createTaskCycle(userId, {
		taskId: requireId(input?.taskId, "taskId"),
		cycleId: requireId(input?.cycleId, "cycleId"),
		stageId: requireId(input?.stageId, "stageId"),
	});

	if (result.status !== "ok") throw placementError(result.status);
	return result.taskCycle; // null when the stage was Backlog
}

export async function updateTaskCycleStageService(
	userId: string,
	input: { taskCycleId: string; stageId: string },
) {
	const result = await updateTaskCycleStage(
		userId,
		requireId(input?.taskCycleId, "taskCycleId"),
		requireId(input?.stageId, "stageId"),
	);

	switch (result.status) {
		case "task_cycle_not_found":
			throw new AppError(404, "Task cycle not found");
		case "invalid_stage":
			throw new AppError(400, "Stage does not belong to this project");
		case "backlog_stage":
			throw new AppError(
				400,
				"Use a move to put a task back in the backlog",
			);
		case "ok":
			return result.taskCycle;
	}
}

export async function moveTaskService(userId: string, input: MoveTaskInput) {
	const result = await moveTaskAcrossCycle(
		userId,
		requireId(input?.taskId, "taskId"),
		parseFromCycleId(input.fromCycleId),
		parseDestination(input.to),
	);

	if (result.status !== "ok") throw placementError(result.status);
	return result.task;
}

export async function moveTasksService(userId: string, input: MoveTasksInput) {
	if (!Array.isArray(input?.tasks) || input.tasks.length === 0) {
		throw new AppError(400, "tasks are required");
	}

	const moves = input.tasks.map((t) => ({
		taskId: requireId(t?.taskId, "taskId"),
		fromCycleId: parseFromCycleId(t.fromCycleId),
	}));

	if (new Set(moves.map((m) => m.taskId)).size !== moves.length) {
		throw new AppError(400, "A task can only appear once per move");
	}

	const result = await moveMultipleTasksAcrossCycle(
		userId,
		moves,
		parseDestination(input.to),
	);

	if (result.status !== "ok") throw placementError(result.status);
	return result.tasks;
}

export async function getTaskCycleService(userId: string, id: string) {
	requireId(id, "id");

	// Non-members get the same 404 as a missing task cycle
	const taskCycle = await getTaskCycleById(id, userId);
	if (!taskCycle) throw new AppError(404, "TaskCycle not found");

	return taskCycle;
}

export async function getTaskCyclesByCycleService(
	userId: string,
	cycleId: string,
) {
	requireId(cycleId, "cycleId");

	if (!(await getCycleProjectIdForMember(cycleId, userId))) {
		throw new AppError(404, "Cycle not found");
	}

	return getTaskCyclesByCycle(cycleId);
}

export async function getTaskCyclesByTaskService(
	userId: string,
	taskId: string,
) {
	requireId(taskId, "taskId");

	if (!(await getTaskProjectIdForMember(taskId, userId))) {
		throw new AppError(404, "Task not found");
	}

	return getTaskCyclesByTask(taskId);
}

export async function getTaskCyclesByProjectService(
	userId: string,
	projectId: string,
) {
	requireId(projectId, "projectId");

	if (!(await isProjectMember(projectId, userId))) {
		throw new AppError(404, "Project not found");
	}

	return getTaskCyclesByProject(projectId);
}

export async function deleteTaskCycleService(
	userId: string,
	taskId: string,
	taskCycleId: string | null,
) {
	const result = await deleteTaskCycle(
		userId,
		requireId(taskId, "taskId"),
		taskCycleId || null,
	);

	switch (result.status) {
		case "task_not_found":
			throw new AppError(404, "Task not found");
		case "task_cycle_not_found":
			throw new AppError(404, "Task cycle not found");
		case "task_cycle_mismatch":
			throw new AppError(400, "Task cycle does not belong to this task");
		case "ok":
			return result.deleted;
	}
}
