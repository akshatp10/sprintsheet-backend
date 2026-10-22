import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "./appError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	if (err instanceof ZodError) {
		res.status(400).json({
			success: false,
			errors: err.flatten().fieldErrors,
		});
		return;
	}
	if (err instanceof AppError) {
		res.status(err.statusCode).json({
			success: false,
			message: err.message,
		});
		return;
	}
	console.error(err);
	res.status(500).json({ success: false, message: "Internal server error" });
};
