import { AppError } from "@/utils/appError";
import { isNonEmptyString, isStringArray, isValidDate } from "@/lib/validation";
import {
	getCycleProjectIdForMember,
	isProjectMember,
} from "@/lib/accessModels";
import { placementError } from "@/features/taskCycles/services/taskCyclesServices";
import {
	createTask,
	getAllTasksByProject,
	getBacklogTasksByProject,
	getCycleTasksByProject,
	getTasksByCycle,
	updateTask,
} from "../model/tasksModels";
import type {
	CreateTaskInput,
	UpdateTaskFields,
	UpdateTaskInput,
} from "../types/tasks.types";

const unique = (values: string[]) => [...new Set(values)];
const cleanTags = (tags: string[]) =>
	unique(tags.map((t) => t.trim()).filter(Boolean));

export async function createTaskService(
	userId: string,
	input: CreateTaskInput,
) {
	if (!isNonEmptyString(input?.projectId))
		throw new AppError(400, "projectId is required");
	if (!isNonEmptyString(input.name))
		throw new AppError(400, "Task name is required");
	if (!isNonEmptyString(input.typeId))
		throw new AppError(400, "typeId is required");

	if (
		input.description !== undefined &&
		typeof input.description !== "string"
	) {
		throw new AppError(400, "description must be a string");
	}
	if (input.assigneeIds !== undefined && !isStringArray(input.assigneeIds)) {
		throw new AppError(400, "assigneeIds must be an array of ids");
	}
	if (input.tags !== undefined && !isStringArray(input.tags)) {
		throw new AppError(400, "tags must be an array of strings");
	}
	if (input.dueDate != null && !isValidDate(input.dueDate)) {
		throw new AppError(400, "dueDate must be in YYYY-MM-DD format");
	}
	if (
		input.cycle &&
		(!isNonEmptyString(input.cycle.id) ||
			!isNonEmptyString(input.cycle.stageId))
	) {
		throw new AppError(400, "cycle needs an id and a stageId");
	}

	const result = await createTask(userId, {
		projectId: input.projectId,
		name: input.name.trim(),
		typeId: input.typeId,
		description: input.description,
		assigneeIds: unique(input.assigneeIds ?? []),
		dueDate: input.dueDate ?? null,
		tags: cleanTags(input.tags ?? []),
		cycle: input.cycle,
	});

	switch (result.status) {
		case "ok":
			return result.task;
		case "project_not_found":
			throw new AppError(404, "Project not found");
		case "type_not_in_project":
			throw new AppError(400, "Type is not available in this project");
		case "invalid_assignees":
			throw new AppError(
				400,
				"All assignees must be members of the project",
			);
		default:
			throw placementError(result.status);
	}
}

export async function updateTaskService(
	userId: string,
	input: UpdateTaskInput,
) {
	const { id, updates } = input;

	if (!isNonEmptyString(id)) throw new AppError(400, "Task id is required");
	if (!updates || typeof updates !== "object")
		throw new AppError(400, "updates are required");

	// Whitelist: clients can't touch projectId, key, isBacklog, createdAt, etc.
	const clean: UpdateTaskFields = {};

	if (updates.name !== undefined) {
		if (!isNonEmptyString(updates.name))
			throw new AppError(400, "Task name cannot be empty");
		clean.name = updates.name.trim();
	}
	if (updates.description !== undefined) {
		if (typeof updates.description !== "string") {
			throw new AppError(400, "description must be a string");
		}
		clean.description = updates.description;
	}
	if (updates.typeId !== undefined) {
		if (!isNonEmptyString(updates.typeId))
			throw new AppError(400, "Invalid typeId");
		clean.typeId = updates.typeId;
	}
	if (updates.assigneeIds !== undefined) {
		if (!isStringArray(updates.assigneeIds)) {
			throw new AppError(400, "assigneeIds must be an array of ids");
		}
		clean.assigneeIds = unique(updates.assigneeIds);
	}
	if (updates.tags !== undefined) {
		if (!isStringArray(updates.tags))
			throw new AppError(400, "tags must be an array of strings");
		clean.tags = cleanTags(updates.tags);
	}
	if (updates.dueDate !== undefined) {
		if (updates.dueDate !== null && !isValidDate(updates.dueDate)) {
			throw new AppError(
				400,
				"dueDate must be in YYYY-MM-DD format or null",
			);
		}
		clean.dueDate = updates.dueDate;
	}

	if (Object.keys(clean).length === 0)
		throw new AppError(400, "No valid fields to update");

	const result = await updateTask(userId, id, clean);

	switch (result.status) {
		case "task_not_found":
			throw new AppError(404, "Task not found");
		case "type_not_in_project":
			throw new AppError(400, "Type is not available in this project");
		case "invalid_assignees":
			throw new AppError(
				400,
				"All assignees must be members of the project",
			);
		case "ok":
			return result.task;
	}
}

const requireProjectAccess = async (userId: string, projectId: string) => {
	if (!projectId) throw new AppError(400, "projectId is required");

	if (!(await isProjectMember(projectId, userId))) {
		throw new AppError(404, "Project not found");
	}
};

export async function getAllTasksService(userId: string, projectId: string) {
	await requireProjectAccess(userId, projectId);
	return getAllTasksByProject(projectId);
}

export async function getBacklogTasksService(
	userId: string,
	projectId: string,
) {
	await requireProjectAccess(userId, projectId);
	return getBacklogTasksByProject(projectId);
}

export async function getCycleTasksByProjectService(
	userId: string,
	projectId: string,
) {
	await requireProjectAccess(userId, projectId);
	return getCycleTasksByProject(projectId);
}

export async function getTasksByCycleService(userId: string, cycleId: string) {
	if (!cycleId) throw new AppError(400, "cycleId is required");

	if (!(await getCycleProjectIdForMember(cycleId, userId))) {
		throw new AppError(404, "Cycle not found");
	}

	return getTasksByCycle(cycleId);
}
