export interface StageSchema {
	id: string;
	name: string;
	createdAt: number;
	updatedAt: number;
}

export interface CreateStageInput {
	id: string;
	name: string;
	createdAt: number;
	updatedAt: number;
}
export interface CreateProjectStageInput {
	id: string;
	project_id: string;
	stage_id: string;
	order: number;
	name: string;
	is_terminal: boolean;
	createdAt: number;
	updatedAt: number;
}

export interface Stage {
	id: string;
	name: string;
}

export interface ProjectStage {
	id: string;
	projectId: string;
	stageId: string;
	order: number;
	name: string;
	isTerminal: boolean;
}
