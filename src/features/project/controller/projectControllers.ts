import type { RequestHandler } from "express";
import {
	createProjectService,
	getAllProjectsByUserService,
	getProjectByIdService,
} from "../services/projectServices";
import { getUserId } from "@/lib/getUserId";

export const createProjectController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const project = await createProjectService(getUserId(res), req.body);

		res.status(201).json({
			success: true,
			project,
		});
	} catch (error) {
		next(error);
	}
};

export const getProjectByIdController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const projectId = String(req.query.projectId ?? "");
		const project = await getProjectByIdService(projectId, getUserId(res));

		res.status(200).json({
			success: true,
			project,
		});
	} catch (error) {
		next(error);
	}
};

export const getAllProjectByUsersController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const includeArchived = req.query.includeArchived === "true";
		const projects = await getAllProjectsByUserService(
			getUserId(res),
			includeArchived,
		);

		res.status(200).json({
			success: true,
			projects,
		});
	} catch (error) {
		next(error);
	}
};
