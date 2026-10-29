import { AppError } from "@/utils/appError";
import type { CreateCycleInput, UpdateCycleInput } from "../types/cycles.types";
import {
	createCycle,
	getCycleById,
	getCyclesByProject,
	isProjectMember,
	updateCycle,
} from "../model/cyclesModels";

const isValidDate = (value: unknown): value is string => {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
		return false;
	return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
};

export async function createCycleService(
	userId: string,
	input: CreateCycleInput,
) {
	const name = input.name?.trim();

	if (!input.projectId) throw new AppError(400, "projectId is required");
	if (!name) throw new AppError(400, "Cycle name is required");
	if (!isValidDate(input.startDate) || !isValidDate(input.endDate)) {
		throw new AppError(400, "Dates must be in YYYY-MM-DD format");
	}
	if (input.startDate >= input.endDate) {
		throw new AppError(400, "Cycle end date must be after start date");
	}

	const result = await createCycle(userId, {
		projectId: input.projectId,
		name,
		startDate: input.startDate,
		endDate: input.endDate,
	});

	switch (result.status) {
		case "project_not_found":
			throw new AppError(404, "Project not found");
		case "overlap":
			throw new AppError(
				409,
				"Cycle dates overlap with an existing cycle",
			);
		case "ok":
			return result.cycle;
	}
}

export async function getCycleService(userId: string, id: string) {
	if (!id) throw new AppError(400, "Cycle id is required");

	// Non-members get the same 404 as a missing cycle
	const cycle = await getCycleById(id, userId);
	if (!cycle) throw new AppError(404, "Cycle not found");

	return cycle;
}

export async function getAllCyclesService(userId: string, projectId: string) {
	if (!projectId) throw new AppError(400, "projectId is required");

	if (!(await isProjectMember(projectId, userId))) {
		throw new AppError(404, "Project not found");
	}

	return getCyclesByProject(projectId);
}

export async function updateCycleService(
	userId: string,
	input: UpdateCycleInput,
) {
	const { id, updates } = input;

	if (!id) throw new AppError(400, "Cycle id is required");
	if (!updates || typeof updates !== "object") {
		throw new AppError(400, "updates are required");
	}

	// Whitelist: clients can't touch projectId, createdAt, etc.
	const clean: UpdateCycleInput["updates"] = {};

	if (updates.name !== undefined) {
		const name = updates.name.trim();
		if (!name) throw new AppError(400, "Cycle name cannot be empty");
		clean.name = name;
	}
	if (updates.startDate !== undefined) {
		if (!isValidDate(updates.startDate)) {
			throw new AppError(400, "startDate must be in YYYY-MM-DD format");
		}
		clean.startDate = updates.startDate;
	}
	if (updates.endDate !== undefined) {
		if (!isValidDate(updates.endDate)) {
			throw new AppError(400, "endDate must be in YYYY-MM-DD format");
		}
		clean.endDate = updates.endDate;
	}

	if (Object.keys(clean).length === 0) {
		throw new AppError(400, "No valid fields to update");
	}

	const result = await updateCycle(userId, id, clean);

	switch (result.status) {
		case "not_found":
			throw new AppError(404, "Cycle not found");
		case "invalid_dates":
			throw new AppError(400, "Cycle end date must be after start date");
		case "overlap":
			throw new AppError(
				409,
				"Cycle dates overlap with an existing cycle",
			);
		case "ok":
			return result.cycle;
	}
}
