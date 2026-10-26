import type { RequestHandler } from "express";
import {
	createProjectTypesService,
	findOrCreateTypesService,
	getAllTypesService,
	getProjectTypesService,
	getTypeByIdService,
} from "../services/typesServices";
import { AppError } from "@/utils/appError";

export const findOrCreateTypesController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const { typeName } = req.body;

		if (!typeName) throw new AppError(400, "Type name is required");

		const { type, created } = await findOrCreateTypesService(typeName);

		res.status(created ? 201 : 200).json({
			success: true,
			type,
		});
	} catch (err) {
		next(err);
	}
};

export const createProjectTypesController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const { projectId } = req.body;
		const { typeName } = req.body;

		const { projectTypes } = await createProjectTypesService(
			projectId,
			typeName,
		);

		res.status(201).json({
			success: true,
			projectTypes,
		});
	} catch (err) {
		next(err);
	}
};

export const getProjectTypesController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const { projectId } = req.body;
		const projectTypes = await getProjectTypesService(projectId);

		res.status(200).json({
			success: true,
			projectTypes,
		});
	} catch (err) {
		next(err);
	}
};

export const getTypeByIdController: RequestHandler = async (req, res, next) => {
	try {
		const { typeId } = req.body;

		if (!typeId) throw new AppError(400, "TypeId is required");

		const type = await getTypeByIdService(typeId);
		res.status(200).json({
			success: true,
			type,
		});
	} catch (err) {
		next(err);
	}
};

export const getAllTypesController: RequestHandler = async (req, res, next) => {
	try {
		const types = await getAllTypesService();
		res.status(200).json({
			success: true,
			types,
		});
	} catch (err) {
		next(err);
	}
};
