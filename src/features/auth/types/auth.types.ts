import z from "zod";
import { loginSchema, registerSchema } from "../schemas/authSchema";

export interface AuthTokenPayload {
	userId: string;
}

export type registerInput = z.infer<typeof registerSchema>;
export type loginInput = z.infer<typeof loginSchema>;
