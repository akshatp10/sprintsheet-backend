import { env } from "@/config/env";
import type { Response } from "express";

const isProduction = env.nodeEnv === "production";

const refreshCookieOptions = {
	httpOnly: true,
	secure: isProduction,
	sameSite: isProduction ? "none" : "lax",
	path: "/api/auth",
} as const;

export const setRefreshCookie = (res: Response, refreshToken: string) => {
	res.cookie("refreshToken", refreshToken, refreshCookieOptions);
};

export const clearRefreshCookie = (res: Response) => {
	res.clearCookie("refreshToken", refreshCookieOptions);
};
