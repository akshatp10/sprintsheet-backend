import { Router } from "express";
import {
	acceptInvitationController,
	getProjectInvitationsController,
	inviteToProjectController,
	previewInvitationController,
	resendInvitationController,
	revokeInvitationController,
} from "../controller/invitationControllers";

// Mount WITHOUT requireAuth: the invite page must work before login/signup.
export const invitationPublicRouter = Router();

invitationPublicRouter.post("/preview", previewInvitationController);

// Mount WITH requireAuth.
const invitationRouter = Router();

invitationRouter.post("/accept", acceptInvitationController);
invitationRouter.post("/invite", inviteToProjectController);
invitationRouter.get("/projectInvitations", getProjectInvitationsController);
invitationRouter.post("/resend", resendInvitationController);
invitationRouter.post("/revoke", revokeInvitationController);

export default invitationRouter;
