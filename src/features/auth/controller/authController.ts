import { RequestHandler } from "express";
import { loginSchema, registerSchema } from "../schemas/authSchema";
import { loginUser, registerUser } from "../services/authServices";

export const authRegisterController: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const input = registerSchema.parse(req.body);
		const { user, token } = await registerUser(input);
		res.status(201).json({ success: true, user, token });
	} catch (err) {
		next(err);
	}
};

export const authLoginController: RequestHandler = async (req, res, next) => {
	try {
		const input = loginSchema.parse(req.body);
		const { user, token } = await loginUser(input);
		res.status(200).json({ success: true, user, token });
	} catch (err) {
		next(err);
	}
};
