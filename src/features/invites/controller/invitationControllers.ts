import type { RequestHandler } from "express";
import {
	acceptInvitationService,
	getInvitationPreviewService,
	getProjectInvitationsService,
	inviteToProjectService,
	resendInvitationService,
	revokeInvitationService,
} from "../services/invitationServices";
import { getUserId } from "@/lib/getUserId";

// Public (no auth): token comes in the body so it stays out of URLs and logs.
export const previewInvitationController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const invitation = await getInvitationPreviewService(req.body?.token);

		res.status(200).json({
			success: true,
			invitation,
		});
	} catch (error) {
		next(error);
	}
};

export const acceptInvitationController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const { projectId } = await acceptInvitationService(
			getUserId(res),
			req.body?.token,
		);

		res.status(200).json({
			success: true,
			projectId,
		});
	} catch (error) {
		next(error);
	}
};

export const inviteToProjectController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const result = await inviteToProjectService(
			getUserId(res),
			String(req.body?.projectId ?? ""),
			req.body?.people,
		);

		res.status(201).json({
			success: true,
			...result,
		});
	} catch (error) {
		next(error);
	}
};

export const getProjectInvitationsController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const invitations = await getProjectInvitationsService(
			String(req.query.projectId ?? ""),
			getUserId(res),
		);

		res.status(200).json({
			success: true,
			invitations,
		});
	} catch (error) {
		next(error);
	}
};

export const resendInvitationController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const result = await resendInvitationService(
			getUserId(res),
			String(req.body?.invitationId ?? ""),
		);

		res.status(200).json({
			success: true,
			...result,
		});
	} catch (error) {
		next(error);
	}
};

export const revokeInvitationController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		await revokeInvitationService(
			getUserId(res),
			String(req.body?.invitationId ?? ""),
		);

		res.status(200).json({
			success: true,
		});
	} catch (error) {
		next(error);
	}
};
