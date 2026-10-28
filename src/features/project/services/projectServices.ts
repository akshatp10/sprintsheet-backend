import { AppError } from "@/utils/appError";
import {
	BACKLOG_STAGE_NAME,
	type CreateProjectInput,
} from "../types/project.types";
import {
	createProject,
	getAllProjectsByUser,
	getProjectDetailsById,
} from "../model/projectModels";

const CYCLE_LENGTHS = ["default", "custom", "nocycle"];

const validateProjectInput = (input: CreateProjectInput) => {
	if (!input.name?.trim())
		throw new AppError(400, "Project name is required");
	if (!input.key?.trim()) throw new AppError(400, "Project key is required");

	if (!CYCLE_LENGTHS.includes(input.cycleLength)) {
		throw new AppError(400, "Invalid cycle length");
	}
	if (typeof input.autoCycle !== "boolean") {
		throw new AppError(400, "autoCycle must be a boolean");
	}

	if (!Array.isArray(input.stages) || input.stages.length === 0) {
		throw new AppError(400, "At least one stage is required");
	}

	const names = input.stages.map((s) => s.name?.trim());

	if (names.some((n) => !n)) {
		throw new AppError(400, "Stage names cannot be empty");
	}
	if (!names.includes(BACKLOG_STAGE_NAME)) {
		throw new AppError(
			400,
			`A project needs a "${BACKLOG_STAGE_NAME}" stage`,
		);
	}
	if (new Set(names).size !== names.length) {
		throw new AppError(400, "Stage names must be unique within a project");
	}
	if (names[names.length - 1] === BACKLOG_STAGE_NAME) {
		throw new AppError(
			400,
			`"${BACKLOG_STAGE_NAME}" cannot be the last stage`,
		);
	}
};

export async function createProjectService(
	ownerId: string,
	input: CreateProjectInput,
) {
	validateProjectInput(input);

	return createProject(ownerId, {
		...input,
		name: input.name.trim(),
		key: input.key.trim(),
		stages: input.stages.map((s) => ({ name: s.name.trim() })),
	});
}

export async function getProjectByIdService(projectId: string, userId: string) {
	if (!projectId) throw new AppError(400, "projectId is required");

	const project = await getProjectDetailsById(projectId, userId);

	// Non-members get the same 404 as a missing project.
	if (!project) throw new AppError(404, "Project not found");

	return project;
}

export async function getAllProjectsByUserService(
	userId: string,
	includeArchived: boolean,
) {
	return getAllProjectsByUser({ userId, includeArchived });
}
