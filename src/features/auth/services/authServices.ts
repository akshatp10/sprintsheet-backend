import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { createUser, findUserByEmail } from "@/features/users/model/userModels";
import {
	AuthTokenPayload,
	loginInput,
	registerInput,
} from "../types/auth.types";
import { AppError } from "@/utils/appError";
import { env } from "@/config/env";

const JWT_SECRET = env.jwt.jwt_secret;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");

const JWT_EXPIRES_IN = (env.jwt.jwt_expiry ??
	"1h") as jwt.SignOptions["expiresIn"];

const DUMMY_HASH =
	"$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$3pXjJ0n2m0wq5m0v8mJ2m3c1k0y8p9Q2m3l4o5p6q7s";

// Signing the token
function signToken(userId: string) {
	return jwt.sign({ userId } satisfies AuthTokenPayload, JWT_SECRET!, {
		expiresIn: JWT_EXPIRES_IN,
	});
}

//Verifying the authenticity of the JWT Token
export function verifyToken(token: string): AuthTokenPayload {
	return jwt.verify(token, JWT_SECRET!) as AuthTokenPayload;
}

export async function registerUser(input: registerInput) {
	const existing = await findUserByEmail(input.email);
	if (existing) throw new AppError(409, "Email already in use");

	const passwordHash = await argon2.hash(input.password, {
		type: argon2.argon2id,
	});
	const now = Date.now();

	try {
		const user = await createUser({
			id: randomUUID(),
			name: input.name,
			email: input.email,
			passwordHash,
			createdAt: now,
			updatedAt: now,
		});
		return { user, token: signToken(user.id) };
	} catch (err: any) {
		// race condition: unique violation
		if (err?.code === "23505")
			throw new AppError(409, "Email already in use");
		throw err;
	}
}

export async function loginUser(input: loginInput) {
	const user = await findUserByEmail(input.email);

	// Always run a verify so response time doesn't reveal whether the email exists
	const valid = await argon2
		.verify(user?.password ?? DUMMY_HASH, input.password)
		.catch(() => false);

	if (!user || !valid) throw new AppError(401, "Invalid email or password");

	const { password, created_at, updated_at, ...safeUser } = user;
	return { user: safeUser, token: signToken(user.id) };
}
