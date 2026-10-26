export interface TypeSchema {
	id: string;
	name: string;
	createdAt: number;
	updatedAt: number;
}

export interface CreateTypesInput {
	id: string;
	name: string;
	createdAt: number;
	updatedAt: number;
}
export interface CreateProjectTypesInput {
	id: string;
	project_id: string;
	type_id: string;
	createdAt: number;
	updatedAt: number;
}

export interface Types {
	id: string;
	name: string;
}

export interface ProjectTypes {
	id: string;
	projectId: string;
	typeId: string;
}
