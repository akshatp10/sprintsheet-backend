import type { RequestHandler } from "express";
import {
	createProjectStageService,
	findOrCreateStageService,
	getProjectStagesService,
} from "../services/stagesServices";

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
			data: { projectStage },
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
			data: { projectStages },
		});
	} catch (err) {
		next(err);
	}
};
