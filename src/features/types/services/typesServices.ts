import { randomUUID } from "node:crypto";
import { AppError } from "@/utils/appError";
import {
	createProjectType,
	createTypeByName,
	findTypeByName,
	getAllTypes,
	getProjectTypes,
	getTypeById,
} from "../model/typesModels";
import { CreateProjectTypesInput } from "../types/types";

export async function findOrCreateTypesService(typeName: string) {
	const name = typeName.trim();

	if (!name) {
		throw new AppError(400, "Type name is required");
	}

	const existingType = await findTypeByName(name);

	if (existingType) {
		return { type: existingType, created: false };
	}

	const now = Date.now();

	try {
		const type = await createTypeByName({
			id: randomUUID(),
			name,
			createdAt: now,
			updatedAt: now,
		});

		return { type, created: true };
	} catch (err: unknown) {
		throw new AppError(500, "Cannot create or find Type");
	}
}

export async function createProjectTypesService(
	projectId: string,
	typeName: string,
) {
	const name = typeName.trim();

	if (!name) {
		throw new AppError(400, "Type name is required");
	}

	const { type } = await findOrCreateTypesService(name);

	if (!type) {
		throw new AppError(404, "Type not found");
	}

	const now = Date.now();

	const input: CreateProjectTypesInput = {
		id: randomUUID(),
		project_id: projectId,
		type_id: type.id,
		createdAt: now,
		updatedAt: now,
	};

	try {
		const projectTypes = await createProjectType(input);

		return { projectTypes };
	} catch (err: unknown) {
		if (
			typeof err === "object" &&
			err !== null &&
			"code" in err &&
			err.code === "23505"
		) {
			throw new AppError(409, "Type already exists in this project");
		}

		throw err;
	}
}

export async function getProjectTypesService(projectId: string) {
	const projectTypes = await getProjectTypes(projectId);

	return projectTypes;
}

export async function getTypeByIdService(typeId: string) {
	const type = await getTypeById(typeId);

	if (!type) {
		throw new AppError(404, "Type not found");
	}

	return type;
}

export async function getAllTypesService() {
	const types = await getAllTypes();

	if (!types) {
		throw new AppError(404, "No Types not found");
	}

	return types;
}
