import { randomUUID } from "node:crypto";
import { pool } from "@/db/pool";
import type {
	AcceptInvitationFailure,
	AcceptInvitationResult,
	UpsertInvitationInput,
} from "../types/invitation.types";

export async function isProjectAdmin(projectId: string, userId: string) {
	const { rowCount } = await pool.query(
		`SELECT 1 FROM project_members
		 WHERE project_id = $1 AND user_id = $2 AND role = 'admin'`,
		[projectId, userId],
	);
	return (rowCount ?? 0) > 0;
}

/** Returns the lowercased emails (from `emails`) that already belong to the project. */
export async function findMemberEmails(projectId: string, emails: string[]) {
	const { rows } = await pool.query(
		`SELECT lower(u.email) AS email
		 FROM project_members pm
		 JOIN users u ON u.id = pm.user_id
		 WHERE pm.project_id = $1 AND lower(u.email) = ANY($2::text[])`,
		[projectId, emails],
	);
	return rows.map((row) => row.email as string);
}

/** Names used in the invitation email. */
export async function getInviteContext(projectId: string, userId: string) {
	const { rows } = await pool.query(
		`SELECT p.name AS "projectName", u.name AS "inviterName"
		 FROM projects p
		 CROSS JOIN users u
		 WHERE p.id = $1 AND u.id = $2`,
		[projectId, userId],
	);
	return rows[0] as
		| { projectName: string; inviterName: string }
		| undefined;
}

/**
 * Creates a pending invitation. If one is already pending for the same
 * (project, email), it is refreshed with the new token/role/expiry instead,
 * which also invalidates the previously emailed link.
 */
export async function upsertPendingInvitation(input: UpsertInvitationInput) {
	await pool.query(
		`INSERT INTO project_invitations
			(
				id, project_id, email, role, token_hash, status,
				invited_by, expires_at, created_at, updated_at
			)
		 VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $8)
		 ON CONFLICT (project_id, email) WHERE status = 'pending'
		 DO UPDATE SET
			role = EXCLUDED.role,
			token_hash = EXCLUDED.token_hash,
			invited_by = EXCLUDED.invited_by,
			expires_at = EXCLUDED.expires_at,
			updated_at = EXCLUDED.updated_at`,
		[
			randomUUID(),
			input.projectId,
			input.email,
			input.role,
			input.tokenHash,
			input.invitedBy,
			input.expiresAt,
			input.now,
		],
	);
}

export async function getInvitationByTokenHash(tokenHash: string) {
	const { rows } = await pool.query(
		`SELECT i.status, i.email, i.role,
		        i.expires_at AS "expiresAt",
		        p.name AS "projectName",
		        u.name AS "inviterName",
		        EXISTS (
		          SELECT 1 FROM users x WHERE lower(x.email) = i.email
		        ) AS "accountExists"
		 FROM project_invitations i
		 JOIN projects p ON p.id = i.project_id
		 JOIN users u ON u.id = i.invited_by
		 WHERE i.token_hash = $1`,
		[tokenHash],
	);
	return rows[0] as
		| {
				status: "pending" | "accepted" | "revoked" | "expired";
				email: string;
				role: "member" | "admin";
				expiresAt: string | number;
				projectName: string;
				inviterName: string;
				accountExists: boolean;
		  }
		| undefined;
}

export async function getInvitationById(invitationId: string) {
	const { rows } = await pool.query(
		`SELECT id, project_id AS "projectId", email, role, status
		 FROM project_invitations
		 WHERE id = $1`,
		[invitationId],
	);
	return rows[0] as
		| {
				id: string;
				projectId: string;
				email: string;
				role: "member" | "admin";
				status: "pending" | "accepted" | "revoked" | "expired";
		  }
		| undefined;
}

/** Pending invitations of a project (expired-but-still-pending ones are flagged). */
export async function getPendingInvitationsByProject(
	projectId: string,
	now: number,
) {
	const { rows } = await pool.query(
		`SELECT i.id, i.email, i.role,
		        i.expires_at AS "expiresAt",
		        i.created_at AS "createdAt",
		        (i.expires_at < $2) AS "isExpired",
		        u.name AS "invitedByName"
		 FROM project_invitations i
		 JOIN users u ON u.id = i.invited_by
		 WHERE i.project_id = $1 AND i.status = 'pending'
		 ORDER BY i.created_at DESC`,
		[projectId, now],
	);
	return rows;
}

/** Gives a pending invitation a new token + expiry. Undefined if it is no longer pending. */
export async function rotateInvitationToken(input: {
	invitationId: string;
	tokenHash: string;
	expiresAt: number;
	now: number;
}) {
	const { rows } = await pool.query(
		`UPDATE project_invitations
		 SET token_hash = $2, expires_at = $3, updated_at = $4
		 WHERE id = $1 AND status = 'pending'
		 RETURNING email, role`,
		[input.invitationId, input.tokenHash, input.expiresAt, input.now],
	);
	return rows[0] as { email: string; role: "member" | "admin" } | undefined;
}

/** Returns true if a pending invitation was revoked. */
export async function revokeInvitation(invitationId: string, now: number) {
	const { rowCount } = await pool.query(
		`UPDATE project_invitations
		 SET status = 'revoked', updated_at = $2
		 WHERE id = $1 AND status = 'pending'`,
		[invitationId, now],
	);
	return (rowCount ?? 0) > 0;
}

export async function acceptInvitation(
	userId: string,
	tokenHash: string,
): Promise<AcceptInvitationResult> {
	const now = Date.now();

	const client = await pool.connect();
	let transactionStarted = false;

	try {
		await client.query("BEGIN");
		transactionStarted = true;

		// Ends the transaction without changes and reports why.
		const fail = async (
			reason: AcceptInvitationFailure,
		): Promise<AcceptInvitationResult> => {
			await client.query("ROLLBACK");
			transactionStarted = false;
			return { ok: false, reason };
		};

		// 1. Lock the invitation so two accepts can't race
		const { rows } = await client.query(
			`SELECT i.id, i.project_id AS "projectId", i.email, i.role, i.status,
			        i.expires_at AS "expiresAt", i.accepted_by AS "acceptedBy",
			        p.is_archived AS "isArchived"
			 FROM project_invitations i
			 JOIN projects p ON p.id = i.project_id
			 WHERE i.token_hash = $1
			 FOR UPDATE OF i`,
			[tokenHash],
		);
		const invitation = rows[0];

		if (!invitation) return await fail("not_found");

		// Double click / retry by the same user is a success
		if (invitation.status === "accepted") {
			if (invitation.acceptedBy === userId) {
				await client.query("ROLLBACK");
				transactionStarted = false;
				return { ok: true, projectId: invitation.projectId };
			}
			return await fail("accepted");
		}
		if (invitation.status === "revoked") return await fail("revoked");
		if (
			invitation.status === "expired" ||
			Number(invitation.expiresAt) < now
		) {
			return await fail("expired");
		}
		if (invitation.isArchived) return await fail("project_archived");

		// 2. The logged-in account must own the invited email
		const userResult = await client.query(
			`SELECT email FROM users WHERE id = $1`,
			[userId],
		);
		const userEmail = userResult.rows[0]?.email as string | undefined;

		if (!userEmail || userEmail.trim().toLowerCase() !== invitation.email) {
			return await fail("email_mismatch");
		}

		// 3. Add the user as a member (no-op if they already are one)
		await client.query(
			`INSERT INTO project_members
				(id, project_id, user_id, role, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $5)
			 ON CONFLICT (project_id, user_id) DO NOTHING`,
			[randomUUID(), invitation.projectId, userId, invitation.role, now],
		);

		// 4. Mark the invitation as used
		await client.query(
			`UPDATE project_invitations
			 SET status = 'accepted', accepted_by = $2, updated_at = $3
			 WHERE id = $1`,
			[invitation.id, userId, now],
		);

		await client.query("COMMIT");
		transactionStarted = false;

		return { ok: true, projectId: invitation.projectId };
	} catch (error) {
		if (transactionStarted) {
			try {
				await client.query("ROLLBACK");
			} catch (rollbackError) {
				console.error(
					"Failed to roll back invitation accept:",
					rollbackError,
				);
			}
		}

		throw error;
	} finally {
		client.release();
	}
}
