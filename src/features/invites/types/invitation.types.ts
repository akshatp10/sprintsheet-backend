import { ProjectRole } from "@/features/project/types/project.types";

export const INVITATION_TTL_DAYS = 7;
export const INVITATION_TTL_MS = INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000;
export const MAX_INVITES_PER_REQUEST = 50;

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export interface InvitePerson {
	email: string;
	role: ProjectRole;
}

export interface InviteResult {
	email: string;
	sent: boolean;
}

export interface InviteToProjectResult {
	invitations: InviteResult[];
	/** Emails skipped because they already belong to the project. */
	skipped: string[];
}

export interface UpsertInvitationInput {
	projectId: string;
	email: string;
	role: ProjectRole;
	tokenHash: string;
	invitedBy: string;
	expiresAt: number;
	now: number;
}

export interface InvitationPreview {
	state: InvitationStatus;
	// Only present while the invitation is still pending.
	projectName?: string;
	inviterName?: string;
	email?: string;
	role?: ProjectRole;
	accountExists?: boolean;
}

export type AcceptInvitationFailure =
	| "not_found"
	| "accepted"
	| "revoked"
	| "expired"
	| "email_mismatch"
	| "project_archived";

export type AcceptInvitationResult =
	| { ok: true; projectId: string }
	| { ok: false; reason: AcceptInvitationFailure };
