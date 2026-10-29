import { AppError } from "@/utils/appError";
import { Response } from "express";

export const getUserId = (res: Response): string => {
	const id = res.locals.userId as string | undefined;
	if (!id) throw new AppError(401, "Unauthorized");
	return id;
};
