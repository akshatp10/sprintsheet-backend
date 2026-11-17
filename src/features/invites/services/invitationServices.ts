import { AppError } from "@/utils/appError";
import { generateToken, hashToken } from "@/lib/utils/tokens";
import { sendMail } from "@/lib/utils/mailer";
import {
	acceptInvitation,
	findMemberEmails,
	getInviteContext,
	getInvitationById,
	getInvitationByTokenHash,
	getPendingInvitationsByProject,
	isProjectAdmin,
	revokeInvitation,
	rotateInvitationToken,
	upsertPendingInvitation,
} from "../model/invitationModels";
import {
	INVITATION_TTL_MS,
	MAX_INVITES_PER_REQUEST,
	type AcceptInvitationFailure,
	type InvitationPreview,
	type InvitePerson,
	type InviteResult,
	type InviteToProjectResult,
} from "../types/invitation.types";
import { buildInvitationEmail } from "@/lib/utils/invitationEmail";
import { ProjectRole } from "@/features/project/types/project.types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES: ProjectRole[] = ["member", "admin"];

const ACCEPT_FAILURES: Record<AcceptInvitationFailure, [number, string]> = {
	not_found: [404, "Invitation not found"],
	accepted: [410, "This invitation has already been used"],
	revoked: [410, "This invitation was cancelled"],
	expired: [410, "This invitation has expired"],
	email_mismatch: [
		403,
		"This invitation was sent to a different email address",
	],
	project_archived: [409, "This project is archived"],
};

const requireToken = (token: unknown) => {
	if (typeof token !== "string" || !token.trim()) {
		throw new AppError(400, "Invitation token is required");
	}
	return token.trim();
};

const assertProjectAdmin = async (projectId: string, userId: string) => {
	if (!(await isProjectAdmin(projectId, userId))) {
		throw new AppError(403, "Only project admins can manage invitations");
	}
};

/** Validates, lowercases and dedupes (last role wins) the people to invite. */
export const normalizeInvitePeople = (people: unknown): InvitePerson[] => {
	if (!Array.isArray(people) || people.length === 0) {
		throw new AppError(400, "At least one person to invite is required");
	}
	if (people.length > MAX_INVITES_PER_REQUEST) {
		throw new AppError(
			400,
			`You can invite at most ${MAX_INVITES_PER_REQUEST} people at a time`,
		);
	}

	const byEmail = new Map<string, ProjectRole>();

	for (const person of people as Partial<InvitePerson>[]) {
		const email =
			typeof person?.email === "string"
				? person.email.trim().toLowerCase()
				: "";

		if (!EMAIL_REGEX.test(email)) {
			throw new AppError(400, `Invalid email: ${person?.email ?? ""}`);
		}
		if (!person.role || !ROLES.includes(person.role)) {
			throw new AppError(400, `Invalid role for ${email}`);
		}

		byEmail.set(email, person.role);
	}

	return [...byEmail].map(([email, role]) => ({ email, role }));
};

/** Sends one invitation email. Never throws; failures are reported via `sent: false`. */
const deliverInvitation = async (input: {
	email: string;
	role: ProjectRole;
	token: string;
	projectName: string;
	inviterName: string;
}): Promise<InviteResult> => {
	const link = `${process.env.APP_URL}/invite/${input.token}`;

	try {
		await sendMail({
			to: input.email,
			...buildInvitationEmail({
				projectName: input.projectName,
				inviterName: input.inviterName,
				role: input.role,
				link,
			}),
		});
		return { email: input.email, sent: true };
	} catch (error) {
		console.error("Failed to send invitation email:", input.email, error);
		return { email: input.email, sent: false };
	}
};

export async function inviteToProjectService(
	inviterId: string,
	projectId: string,
	input: unknown,
): Promise<InviteToProjectResult> {
	if (!projectId) throw new AppError(400, "projectId is required");

	const people = normalizeInvitePeople(input);

	await assertProjectAdmin(projectId, inviterId);

	// Skip people who are already members
	const memberEmails = new Set(
		await findMemberEmails(
			projectId,
			people.map((p) => p.email),
		),
	);
	const skipped = people
		.filter((p) => memberEmails.has(p.email))
		.map((p) => p.email);
	const toInvite = people.filter((p) => !memberEmails.has(p.email));

	if (toInvite.length === 0) return { invitations: [], skipped };

	const context = await getInviteContext(projectId, inviterId);
	if (!context) throw new AppError(404, "Project not found");

	const now = Date.now();
	const expiresAt = now + INVITATION_TTL_MS;

	// 1. Save every invitation first
	const created: { email: string; role: ProjectRole; token: string }[] = [];

	for (const person of toInvite) {
		const token = generateToken();

		await upsertPendingInvitation({
			projectId,
			email: person.email,
			role: person.role,
			tokenHash: hashToken(token),
			invitedBy: inviterId,
			expiresAt,
			now,
		});

		created.push({ email: person.email, role: person.role, token });
	}

	// 2. Then send the emails (a failed email never undoes a saved invitation)
	const invitations = await Promise.all(
		created.map((invite) => deliverInvitation({ ...invite, ...context })),
	);

	return { invitations, skipped };
}

/** Public: lets the frontend decide between accept / login / signup / error. */
export async function getInvitationPreviewService(
	token: unknown,
): Promise<InvitationPreview> {
	const invitation = await getInvitationByTokenHash(
		hashToken(requireToken(token)),
	);

	if (!invitation) throw new AppError(404, "Invitation not found");

	const isExpired =
		invitation.status === "expired" ||
		(invitation.status === "pending" &&
			Number(invitation.expiresAt) < Date.now());

	if (isExpired) return { state: "expired" };

	// Details are only exposed while the invitation can still be used.
	if (invitation.status !== "pending") return { state: invitation.status };

	return {
		state: "pending",
		projectName: invitation.projectName,
		inviterName: invitation.inviterName,
		email: invitation.email,
		role: invitation.role,
		accountExists: invitation.accountExists,
	};
}

export async function acceptInvitationService(userId: string, token: unknown) {
	const result = await acceptInvitation(
		userId,
		hashToken(requireToken(token)),
	);

	if (!result.ok) {
		const [status, message] = ACCEPT_FAILURES[result.reason];
		throw new AppError(status, message);
	}

	return { projectId: result.projectId };
}

export async function getProjectInvitationsService(
	projectId: string,
	userId: string,
) {
	if (!projectId) throw new AppError(400, "projectId is required");

	await assertProjectAdmin(projectId, userId);

	return getPendingInvitationsByProject(projectId, Date.now());
}

export async function resendInvitationService(
	userId: string,
	invitationId: string,
): Promise<InviteResult> {
	if (!invitationId) throw new AppError(400, "invitationId is required");

	const invitation = await getInvitationById(invitationId);
	if (!invitation) throw new AppError(404, "Invitation not found");

	await assertProjectAdmin(invitation.projectId, userId);

	if (invitation.status !== "pending") {
		throw new AppError(409, "Only pending invitations can be resent");
	}

	const context = await getInviteContext(invitation.projectId, userId);
	if (!context) throw new AppError(404, "Project not found");

	const now = Date.now();
	const token = generateToken();

	// New token + fresh expiry; the previously emailed link stops working.
	const rotated = await rotateInvitationToken({
		invitationId,
		tokenHash: hashToken(token),
		expiresAt: now + INVITATION_TTL_MS,
		now,
	});
	if (!rotated) {
		throw new AppError(409, "Only pending invitations can be resent");
	}

	return deliverInvitation({
		email: rotated.email,
		role: rotated.role,
		token,
		...context,
	});
}

export async function revokeInvitationService(
	userId: string,
	invitationId: string,
) {
	if (!invitationId) throw new AppError(400, "invitationId is required");

	const invitation = await getInvitationById(invitationId);
	if (!invitation) throw new AppError(404, "Invitation not found");

	await assertProjectAdmin(invitation.projectId, userId);

	const revoked = await revokeInvitation(invitationId, Date.now());
	if (!revoked) {
		throw new AppError(409, "Only pending invitations can be revoked");
	}
}
