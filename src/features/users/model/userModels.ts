import { pool } from "@/db/pool";
import { CreateUserInput } from "../types/users.types";

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
	return result.rows[0] as
		| {
				id: string;
				name: string;
				email: string;
				password: string;
				created_at: Date;
				updated_at: Date;
		  }
		| undefined;
}
