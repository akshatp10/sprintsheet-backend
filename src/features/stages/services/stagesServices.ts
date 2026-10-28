import { randomUUID } from "node:crypto";
import { AppError } from "@/utils/appError";
import {
	createProjectStage,
	createStageByName,
	findStageByName,
	getAllStages,
	getProjectStages,
	getStageById,
} from "../model/stagesModel";
import { CreateProjectStageInput } from "../types/stages.types";

export async function findOrCreateStageService(stageName: string) {
	const name = stageName.trim();

	if (!name) {
		throw new AppError(400, "Stage name is required");
	}

	const existingStage = await findStageByName(name);

	if (existingStage) {
		return { stage: existingStage, created: false };
	}

	const now = Date.now();

	try {
		const stage = await createStageByName({
			id: randomUUID(),
			name,
			createdAt: now,
			updatedAt: now,
		});

		return { stage, created: true };
	} catch (err: unknown) {
		throw new AppError(500, "Cannot create or find stage");
	}
}

export async function createProjectStageService(
	projectId: string,
	stageName: string,
	order: number,
	isTerminal: boolean,
) {
	const name = stageName.trim();

	if (!name) {
		throw new AppError(400, "Stage name is required");
	}

	const { stage } = await findOrCreateStageService(name);

	if (!stage) {
		throw new AppError(404, "Stage not found");
	}

	const now = Date.now();

	const input: CreateProjectStageInput = {
		id: randomUUID(),
		project_id: projectId,
		stage_id: stage.id,
		order,
		name: stage.name,
		is_terminal: isTerminal,
		createdAt: now,
		updatedAt: now,
	};

	try {
		const projectStage = await createProjectStage(input);

		return { projectStage };
	} catch (err: unknown) {
		if (
			typeof err === "object" &&
			err !== null &&
			"code" in err &&
			err.code === "23505"
		) {
			throw new AppError(
				409,
				"Stage already exists in this project or the order is already taken",
			);
		}

		throw err;
	}
}

export async function getProjectStagesService(projectId: string) {
	const projectStages = await getProjectStages(projectId);

	return { projectStages };
}

export async function getStageByIdService(stageId: string) {
	const stage = await getStageById(stageId);

	if (!stage) throw new AppError(404, "Stage not found");

	return stage;
}

export async function getAllStagesService() {
	const stages = await getAllStages();

	if (!stages) throw new AppError(404, "Stages not found");

	return stages;
}
