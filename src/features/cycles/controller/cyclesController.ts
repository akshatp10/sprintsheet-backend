import type { RequestHandler } from "express";
import {
	createCycleService,
	getAllCyclesService,
	getCycleService,
	updateCycleService,
} from "../services/cyclesServices";
import { getUserId } from "@/lib/getUserId";

export const createCycleController: RequestHandler = async (req, res, next) => {
	try {
		const cycle = await createCycleService(getUserId(res), req.body.input);

		res.status(201).json({
			status: 201,
			success: true,
			message: "Successfully created cycle",
			cycle,
		});
	} catch (error) {
		next(error);
	}
};

export const getCycleController: RequestHandler = async (req, res, next) => {
	try {
		const cycle = await getCycleService(
			getUserId(res),
			String(req.query.id ?? ""),
		);

		res.status(200).json({
			status: 200,
			success: true,
			message: "Successfully fetched cycle",
			cycle,
		});
	} catch (error) {
		next(error);
	}
};

export const getAllCyclesController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const cycles = await getAllCyclesService(
			getUserId(res),
			String(req.query.projectId ?? ""),
		);

		res.status(200).json({
			status: 200,
			success: true,
			message: "Successfully fetched cycles",
			cycles,
		});
	} catch (error) {
		next(error);
	}
};

export const updateCycleController: RequestHandler = async (req, res, next) => {
	try {
		const cycle = await updateCycleService(getUserId(res), {
			id: req.body?.id,
			updates: req.body?.updates,
		});

		res.status(200).json({
			status: 200,
			success: true,
			message: "Successfully updated cycle",
			cycle,
		});
	} catch (error) {
		next(error);
	}
};
