import { pool } from "@/db/pool";
import {
	CreateGoogleUserInput,
	CreateUserInput,
	User,
	UserSchema,
	UserSummary,
} from "../types/users.types";

export async function createUser(input: CreateUserInput) {
	const result = await pool.query(
		`INSERT INTO users
      (id, name, email, password, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, created_at, updated_at`,
		[
			input.id,
			input.name,
			input.email,
			input.passwordHash,
			input.createdAt,
			input.updatedAt,
		],
	);

	return result.rows[0];
}

export async function findUserByEmail(email: string) {
	const result = await pool.query(
		`SELECT id, name, email, password, created_at, updated_at
		 FROM users WHERE email = $1`,
		[email],
	);
	return result.rows[0] as UserSchema | undefined;
}

export async function findUserByGoogleId(googleId: string) {
	const result = await pool.query(
		`SELECT * FROM users WHERE google_id = $1 LIMIT 1`,
		[googleId],
	);

	return result.rows[0] ?? null;
}

export async function createGoogleUser(input: CreateGoogleUserInput) {
	const result = await pool.query(
		`INSERT INTO users (
            id, name, email, password, is_google,
            google_id, created_at, updated_at
        )
        VALUES ($1, $2, $3, NULL, TRUE, $4, $5, $6)
        RETURNING *`,
		[
			input.id,
			input.name,
			input.email,
			input.googleId,
			input.createdAt,
			input.updatedAt,
		],
	);

	return result.rows[0];
}

export async function findUserById(id: string) {
	const result = await pool.query(
		`SELECT id, name, email
		 FROM users WHERE id = $1`,
		[id],
	);
	return result.rows[0] as User | undefined;
}

export async function findUsersByIds(ids: string[]) {
	const result = await pool.query(
		`SELECT id, name
         FROM users
         WHERE id = ANY($1::text[])
		 ORDER BY array_position($1::text[], id);`,
		[ids],
	);

	return (result.rows as UserSummary[]) || [];
}

export async function findUsersByProjectId(
	projectId: string,
): Promise<UserSummary[]> {
	const result = await pool.query(
		`SELECT u.id, u.name
         FROM project_members pm
         JOIN users u ON u.id = pm.user_id
         WHERE pm.project_id = $1
         ORDER BY pm.created_at ASC`,
		[projectId],
	);

	return result.rows as UserSummary[];
}
