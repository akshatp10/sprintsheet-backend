import { verifyToken } from "@/features/auth/services/authServices";
import { RequestHandler } from "express";

export const requireAuth: RequestHandler = (req, res, next) => {
	const header = req.headers.authorization;
	if (!header?.startsWith("Bearer ")) {
		res.status(401).json({
			success: false,
			message: "Invalid : No Token Present",
		});
		return;
	}
	try {
		const payload = verifyToken(header.slice(7));
		res.locals.userId = payload.userId;
		next();
	} catch {
		res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
};
