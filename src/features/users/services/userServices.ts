import { AppError } from "@/utils/appError";
import { findUserById, findUsersByProjectId } from "../model/userModels";

export async function getUserById(userId: string) {
	const user = await findUserById(userId);

	if (!user) throw new AppError(404, "No User Found");
	return { user };
}

export async function getUsersByProject(projectId: string) {
	const users = await findUsersByProjectId(projectId);
	if (!users) {
		throw new AppError(404, "No Users Found");
	}
	return users;
}
