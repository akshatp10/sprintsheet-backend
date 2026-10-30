import type { Request, RequestHandler } from "express";
import { getUserId } from "./getUserId";

export const query = (req: Request, key: string) =>
	String(req.query[key] ?? "");

export const handle =
	<T>(
		status: number,
		message: string,
		fn: (req: Request, userId: string) => Promise<T>,
	): RequestHandler =>
	async (req, res, next) => {
		try {
			const data = await fn(req, getUserId(res));
			res.status(status).json({ status, success: true, message, data });
		} catch (error) {
			next(error);
		}
	};
