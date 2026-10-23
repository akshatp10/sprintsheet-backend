import z from "zod";
import { loginSchema, registerSchema } from "../schemas/authSchema";
import { ApiResponse } from "@/utils/apiResponse";

export interface AuthTokenPayload {
	userId: string;
}

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthUser {
	id: string;
	email: string;
}

export interface AuthData {
	user: AuthUser;
	token: string;
}

export type AuthResponse = ApiResponse<AuthData>;
