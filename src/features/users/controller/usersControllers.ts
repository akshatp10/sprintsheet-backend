import { RequestHandler } from "express";
import {
	getUserById,
	getUsersByIds,
	getUsersByProject,
} from "../services/userServices";
import { getUserId } from "@/lib/getUserId";

export const getUserController: RequestHandler = async (req, res, next) => {
	try {
		const userId = getUserId(res);
		const { user } = await getUserById(userId);
		res.status(200).json({ success: true, user });
	} catch (err) {
		next(err);
	}
};

export const getUserByIdController: RequestHandler = async (req, res, next) => {
	try {
		const { userId } = req.body;
		const { user } = await getUserById(userId);
		res.status(200).json({ success: true, user });
	} catch (err) {
		next(err);
	}
};

export const getUsersByIdsController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const { userIds } = req.body;
		const users = await getUsersByIds(userIds);
		res.status(200).json({ success: true, users });
	} catch (err) {
		next(err);
	}
};

export const getUsersByProjectController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const { projectId } = req.body;
		const users = await getUsersByProject(projectId);
		res.status(200).json({ success: true, users });
	} catch (err) {
		next(err);
	}
};
