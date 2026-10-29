import type { RequestHandler } from "express";
import { loginSchema, registerSchema } from "../schemas/authSchema";
import {
	googleLogin,
	loginUser,
	refreshAccessToken,
	registerUser,
} from "../services/authServices";
import { clearRefreshCookie, setRefreshCookie } from "@/lib/refreshCookie";

export const authRegisterController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const input = registerSchema.parse(req.body);
		const { user, token } = await registerUser(input);

		setRefreshCookie(res, token.refreshToken);

		res.status(201).json({
			success: true,
			data: {
				user,
				token: {
					accessToken: token.accessToken,
				},
			},
		});
	} catch (err) {
		next(err);
	}
};

export const authLoginController: RequestHandler = async (req, res, next) => {
	try {
		const input = loginSchema.parse(req.body);
		const { user, token } = await loginUser(input);

		setRefreshCookie(res, token.refreshToken);

		res.status(200).json({
			success: true,
			data: {
				user,
				token: {
					accessToken: token.accessToken,
				},
			},
		});
	} catch (err) {
		next(err);
	}
};

export const authGoogleController: RequestHandler = async (req, res, next) => {
	try {
		const { idToken } = req.body;

		if (typeof idToken !== "string" || !idToken.trim()) {
			res.status(400).json({
				success: false,
				message: "Google ID token is required",
			});
			return;
		}

		const { user, token } = await googleLogin(idToken);

		setRefreshCookie(res, token.refreshToken);

		res.status(200).json({
			success: true,
			data: {
				user,
				token: {
					accessToken: token.accessToken,
				},
			},
		});
	} catch (err) {
		next(err);
	}
};

export const authRefreshAccessTokenController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const refreshToken = req.cookies?.refreshToken;

		if (typeof refreshToken !== "string" || !refreshToken.trim()) {
			res.status(401).json({
				success: false,
				message: "Refresh token missing or expired",
			});
			return;
		}

		const tokens = await refreshAccessToken(refreshToken);
		setRefreshCookie(res, tokens.refreshToken);

		res.status(200).json({
			success: true,
			data: {
				accessToken: tokens.accessToken,
			},
		});
	} catch (err) {
		next(err);
	}
};

export const authLogoutController: RequestHandler = (_req, res, next) => {
	try {
		clearRefreshCookie(res);

		res.status(200).json({
			success: true,
			message: "Logged out successfully",
		});
	} catch (err) {
		next(err);
	}
};
