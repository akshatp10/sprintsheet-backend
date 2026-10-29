import { randomUUID } from "node:crypto";
import { AppError } from "@/utils/appError";
import {
	createProjectStage,
	findOrCreateStageByName,
	getAllStages,
	getProjectStages,
	getStageById,
} from "../model/stagesModel";
import { CreateProjectStageInput } from "../types/stages.types";

export async function findOrCreateStageService(stageName: string) {
	const name = stageName.trim();

	if (!name) {
		throw new AppError(400, "Type name is required");
	}

	try {
		return await findOrCreateStageByName(name);
	} catch (err) {
		throw new AppError(500, "Cannot create or find Type");
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
