import { pool } from "@/db/pool";
import type {
	CreateProjectStageInput,
	CreateStageInput,
	ProjectStage,
	Stage,
} from "../types/stages.types";

export async function findStageByName(
	stageName: string,
): Promise<Stage | undefined> {
	const result = await pool.query<Stage>(
		`SELECT id, name
         FROM stages
         WHERE name = $1`,
		[stageName],
	);

	return result.rows[0];
}

export async function createStageByName(
	input: CreateStageInput,
): Promise<Stage> {
	const result = await pool.query<Stage>(
		`INSERT INTO stages (id, name, created_at, updated_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name`,
		[input.id, input.name, input.createdAt, input.updatedAt],
	);

	return result.rows[0];
}

export async function createProjectStage(
	input: CreateProjectStageInput,
): Promise<ProjectStage> {
	const result = await pool.query<ProjectStage>(
		`INSERT INTO project_stages (
       id,
       project_id,
       stage_id,
       "order",
       name,
       is_terminal,
       created_at,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING
       id,
       project_id AS "projectId",
       stage_id AS "stageId",
       "order",
       name,
       is_terminal AS "isTerminal"`,
		[
			input.id,
			input.project_id,
			input.stage_id,
			input.order,
			input.name,
			input.is_terminal,
			input.createdAt,
			input.updatedAt,
		],
	);

	return result.rows[0];
}

export async function getProjectStages(
	projectId: string,
): Promise<ProjectStage[]> {
	const result = await pool.query<ProjectStage>(
		`SELECT
       id,
       project_id AS "projectId",
       stage_id AS "stageId",
       "order",
       name,
       is_terminal AS "isTerminal",
     FROM project_stages
     WHERE project_id = $1
     ORDER BY "order" ASC`,
		[projectId],
	);

	return result.rows;
}

export async function getStageById(id: string): Promise<Stage | undefined> {
	const result = await pool.query<Stage>(
		`SELECT id, name
     FROM stages
     WHERE id = $1`,
		[id],
	);

	return result.rows[0];
}
export async function getAllStages(): Promise<Stage[] | undefined> {
	const result = await pool.query<Stage>(
		`SELECT id, name
     FROM stages`,
	);

	return result.rows;
}
