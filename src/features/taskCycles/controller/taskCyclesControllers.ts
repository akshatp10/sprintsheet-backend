import type { RequestHandler } from "express";
import { getUserId } from "@/lib/getUserId";
import {
	createTaskCycleService,
	deleteTaskCycleService,
	getTaskCycleService,
	getTaskCyclesByCycleService,
	getTaskCyclesByProjectService,
	getTaskCyclesByTaskService,
	moveTaskService,
	moveTasksService,
	updateTaskCycleStageService,
} from "../services/taskCyclesServices";

export const createTaskCycleController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		// null when the destination stage was Backlog (the task is placed in the backlog instead)
		const taskCycle = await createTaskCycleService(
			getUserId(res),
			req.body,
		);

		res.status(201).json({
			success: true,
			taskCycle,
		});
	} catch (error) {
		next(error);
	}
};

export const updateTaskCycleStageController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const taskCycle = await updateTaskCycleStageService(
			getUserId(res),
			req.body,
		);

		res.status(200).json({
			success: true,
			taskCycle,
		});
	} catch (error) {
		next(error);
	}
};

export const moveTaskController: RequestHandler = async (req, res, next) => {
	try {
		const task = await moveTaskService(getUserId(res), req.body);

		res.status(200).json({
			success: true,
			task,
		});
	} catch (error) {
		next(error);
	}
};

export const moveTasksController: RequestHandler = async (req, res, next) => {
	try {
		const tasks = await moveTasksService(getUserId(res), req.body);

		res.status(200).json({
			success: true,
			tasks,
		});
	} catch (error) {
		next(error);
	}
};

export const getTaskCycleController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const id = String(req.query.id ?? "");
		const taskCycle = await getTaskCycleService(getUserId(res), id);

		res.status(200).json({
			success: true,
			taskCycle,
		});
	} catch (error) {
		next(error);
	}
};

export const getTaskCyclesByCycleController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const cycleId = String(req.query.cycleId ?? "");
		const taskCycles = await getTaskCyclesByCycleService(
			getUserId(res),
			cycleId,
		);

		res.status(200).json({
			success: true,
			taskCycles,
		});
	} catch (error) {
		next(error);
	}
};

export const getTaskCyclesByTaskController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const taskId = String(req.query.taskId ?? "");
		const taskCycles = await getTaskCyclesByTaskService(
			getUserId(res),
			taskId,
		);

		res.status(200).json({
			success: true,
			taskCycles,
		});
	} catch (error) {
		next(error);
	}
};

export const getTaskCyclesByProjectController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const projectId = String(req.query.projectId ?? "");
		const taskCycles = await getTaskCyclesByProjectService(
			getUserId(res),
			projectId,
		);

		res.status(200).json({
			success: true,
			taskCycles,
		});
	} catch (error) {
		next(error);
	}
};

export const deleteTaskCycleController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const taskId = String(req.query.taskId ?? "");
		// Omitted/empty taskCycleId means delete the task itself
		const taskCycleId = String(req.query.taskCycleId ?? "") || null;

		const deleted = await deleteTaskCycleService(
			getUserId(res),
			taskId,
			taskCycleId,
		);

		res.status(200).json({
			success: true,
			deleted,
		});
	} catch (error) {
		next(error);
	}
};
