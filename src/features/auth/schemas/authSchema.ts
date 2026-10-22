import { z } from "zod";

const passwordSchema = z
	.string()
	.min(6, "Password must be at least 6 characters")
	.regex(/[0-9]/, "Password needs at least one number")
	.regex(
		/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/,
		"Password needs at least one special character",
	)
	.regex(/[A-Z]/, "Password needs at least one uppercase letter")
	.regex(/[a-z]/, "Password needs at least one lowercase letter")
	.regex(/^\S*$/, "Password should not have spaces");

export const registerSchema = z.object({
	name: z.string().min(1).max(100),
	email: z.email(),
	password: passwordSchema,
});

export const loginSchema = z.object({
	email: z.email(),
	password: passwordSchema,
});
