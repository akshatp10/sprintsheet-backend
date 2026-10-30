import type { RequestHandler } from "express";
import { getUserId } from "@/lib/getUserId";
import {
	createTaskService,
	getAllTasksService,
	getBacklogTasksService,
	getCycleTasksByProjectService,
	getTasksByCycleService,
	updateTaskService,
} from "../services/tasksServices";

export const createTaskController: RequestHandler = async (req, res, next) => {
	try {
		const task = await createTaskService(getUserId(res), req.body);

		res.status(201).json({
			success: true,
			task,
		});
	} catch (error) {
		next(error);
	}
};

export const updateTaskController: RequestHandler = async (req, res, next) => {
	try {
		const task = await updateTaskService(getUserId(res), {
			id: req.body?.id,
			updates: req.body?.updates,
		});

		res.status(200).json({
			success: true,
			task,
		});
	} catch (error) {
		next(error);
	}
};

export const getAllTasksController: RequestHandler = async (req, res, next) => {
	try {
		const projectId = String(req.query.projectId ?? "");
		const tasks = await getAllTasksService(getUserId(res), projectId);

		res.status(200).json({
			success: true,
			tasks,
		});
	} catch (error) {
		next(error);
	}
};

export const getBacklogTasksController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const projectId = String(req.query.projectId ?? "");
		const tasks = await getBacklogTasksService(getUserId(res), projectId);

		res.status(200).json({
			success: true,
			tasks,
		});
	} catch (error) {
		next(error);
	}
};

export const getTasksByCycleController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const cycleId = String(req.query.cycleId ?? "");
		const tasks = await getTasksByCycleService(getUserId(res), cycleId);

		res.status(200).json({
			success: true,
			tasks,
		});
	} catch (error) {
		next(error);
	}
};

export const getCycleTasksByProjectController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const projectId = String(req.query.projectId ?? "");
		const tasks = await getCycleTasksByProjectService(
			getUserId(res),
			projectId,
		);

		res.status(200).json({
			success: true,
			tasks,
		});
	} catch (error) {
		next(error);
	}
};
