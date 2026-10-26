import { RequestHandler } from "express";
import { loginSchema, registerSchema } from "../schemas/authSchema";
import {
	googleLogin,
	loginUser,
	refreshAccessToken,
	registerUser,
} from "../services/authServices";

export const authRegisterController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const input = registerSchema.parse(req.body);
		const { user, token } = await registerUser(input);
		res.status(201).json({ success: true, data: { user, token } });
	} catch (err) {
		next(err);
	}
};

export const authLoginController: RequestHandler = async (req, res, next) => {
	try {
		const input = loginSchema.parse(req.body);
		const { user, token } = await loginUser(input);
		res.status(200).json({ success: true, data: { user, token } });
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

		res.status(200).json({
			success: true,
			data: { user, token },
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
		const { refreshToken } = req.body;

		if (typeof refreshToken !== "string" || !refreshToken.trim()) {
			res.status(400).json({
				success: false,
				message: "Refresh token is required",
			});
			return;
		}

		const tokens = await refreshAccessToken(refreshToken);

		res.status(200).json({
			success: true,
			data: tokens,
		});
	} catch (err) {
		next(err);
	}
};
