import type { RequestHandler } from "express";
import {
	createProjectStageService,
	findOrCreateStageService,
	getAllStagesService,
	getProjectStagesService,
	getStageByIdService,
} from "../services/stagesServices";
import { AppError } from "@/utils/appError";

export const findOrCreateStageController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const { stageName } = req.body;

		const { stage, created } = await findOrCreateStageService(stageName);

		res.status(created ? 201 : 200).json({
			success: true,
			stage,
		});
	} catch (err) {
		next(err);
	}
};

export const createProjectStageController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const { projectId } = req.body;
		const { stageName, order, isTerminal = false } = req.body;

		const { projectStage } = await createProjectStageService(
			projectId,
			stageName,
			order,
			isTerminal,
		);

		res.status(201).json({
			success: true,
			projectStage,
		});
	} catch (err) {
		next(err);
	}
};

export const getProjectStagesController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const { projectId } = req.body;
		const { projectStages } = await getProjectStagesService(projectId);

		res.status(200).json({
			success: true,
			projectStages,
		});
	} catch (err) {
		next(err);
	}
};

export const getStageByIdController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const { stageId } = req.body;

		if (!stageId) throw new AppError(400, "StageId is required");

		const type = await getStageByIdService(stageId);
		res.status(200).json({
			success: true,
			type,
		});
	} catch (err) {
		next(err);
	}
};

export const getAllStagesController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const types = await getAllStagesService();
		res.status(200).json({
			success: true,
			types,
		});
	} catch (err) {
		next(err);
	}
};
