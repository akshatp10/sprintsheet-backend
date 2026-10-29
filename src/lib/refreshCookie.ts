import { env } from "@/config/env";
import type { CookieOptions, Response } from "express";

export const refreshCookieOptions: CookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax",
	path: "/api/auth",
	maxAge: 21600000,
};

export const setRefreshCookie = (res: Response, refreshToken: string) => {
	res.cookie("refreshToken", refreshToken, refreshCookieOptions);
};

export const clearRefreshCookie = (res: Response) => {
	res.clearCookie("refreshToken", {
		httpOnly: true,
		secure: env.nodeEnv === "production",
		sameSite: "lax",
		path: "/api/auth",
	});
};
