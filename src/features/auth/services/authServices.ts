import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import {
	createGoogleUser,
	createUser,
	findUserByEmail,
	findUserByGoogleId,
} from "@/features/users/model/userModels";
import {
	AuthTokenPayload,
	LoginInput,
	RegisterInput,
} from "../types/auth.types";
import { AppError } from "@/utils/appError";
import { env } from "@/config/env";
import { OAuth2Client } from "google-auth-library";

const GOOGLE_ID = env.google_id;

const googleClient = new OAuth2Client(GOOGLE_ID);

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

export async function registerUser(input: RegisterInput) {
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
		const { password, created_at, updated_at, ...safeUser } = user;
		return { user: safeUser, token: signToken(user.id) };
	} catch (err: any) {
		// race condition: unique violation
		if (err?.code === "23505")
			throw new AppError(409, "Email already in use");
		throw err;
	}
}

export async function loginUser(input: LoginInput) {
	const user = await findUserByEmail(input.email);

	// Always run a verify so response time doesn't reveal whether the email exists
	const valid = await argon2
		.verify(user?.password ?? DUMMY_HASH, input.password)
		.catch(() => false);

	if (!user || !user.password || !valid)
		throw new AppError(401, "Invalid email or password");

	const { password, createdAt, updatedAt, ...safeUser } = user;
	return { user: safeUser, token: signToken(user.id) };
}

export async function googleLogin(idToken: string) {
	let payload;

	try {
		const ticket = await googleClient.verifyIdToken({
			idToken,
			audience: GOOGLE_ID,
		});

		payload = ticket.getPayload();
	} catch {
		throw new AppError(401, "Invalid Google token");
	}

	if (
		!payload?.sub ||
		!payload.email ||
		!payload.name ||
		payload.email_verified !== true
	) {
		throw new AppError(401, "Invalid Google account");
	}

	const googleId = payload.sub;
	const email = payload.email.toLowerCase();
	const name = payload.name;

	const googleUser = await findUserByGoogleId(googleId);

	if (googleUser) {
		const { password, google_id, created_at, updated_at, ...safeUser } =
			googleUser;

		return {
			user: safeUser,
			token: signToken(googleUser.id),
		};
	}

	const existingUser = await findUserByEmail(email);

	if (existingUser) {
		throw new AppError(
			409,
			"This email already has an account. Please use your original login method.",
		);
	}

	const now = Date.now();

	try {
		const user = await createGoogleUser({
			id: randomUUID(),
			name,
			email,
			googleId,
			createdAt: now,
			updatedAt: now,
		});

		const { password, google_id, created_at, updated_at, ...safeUser } =
			user;

		return {
			user: safeUser,
			token: signToken(user.id),
		};
	} catch (err: any) {
		if (err?.code === "23505") {
			const existing = await findUserByGoogleId(googleId);

			if (existing) {
				const {
					password,
					google_id,
					created_at,
					updated_at,
					...safeUser
				} = existing;

				return {
					user: safeUser,
					token: signToken(existing.id),
				};
			}

			throw new AppError(
				409,
				"This email already has an account. Please use your original login method.",
			);
		}

		throw err;
	}
}
