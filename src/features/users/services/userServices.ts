import { AppError } from "@/utils/appError";
import { findUserById, findUsersByIds } from "../model/userModels";

export async function getUserById(userId: string) {
	const user = await findUserById(userId);

	if (!user) throw new AppError(404, "No User Found");
	return { user };
}

export async function getUsersByIds(userIds: string[]) {
	const users = await findUsersByIds(userIds);
	if (!users.length) {
		throw new AppError(404, "No Users Found");
	}
	return users;
}

export async function getUsersByProject(projectId: string) {
	const users = await findUserById(projectId);
	if (!users) {
		throw new AppError(404, "No Users Found");
	}
	return users;
}
