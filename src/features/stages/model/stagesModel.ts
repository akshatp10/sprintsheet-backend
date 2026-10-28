import { pool } from "@/db/pool";
import type {
	CreateProjectStageInput,
	CreateStageInput,
	ProjectStage,
	Stage,
} from "../types/stages.types";
import { Pool, PoolClient } from "pg";
import { randomUUID } from "node:crypto";

type DbClient = Pool | PoolClient;

export async function findOrCreateStageByName(
	name: string,
	now: number = Date.now(),
	client: DbClient = pool as unknown as DbClient,
): Promise<{ stage: Stage; created: boolean }> {
	const id = randomUUID();

	const result = await client.query<Stage>(
		`INSERT INTO stages (
			id, name, created_at, updated_at
		)
		VALUES ($1, $2, $3, $3)
		ON CONFLICT (name)
		DO UPDATE SET name = EXCLUDED.name
		RETURNING id, name`,
		[id, name, now],
	);

	return {
		stage: result.rows[0],
		created: result.rows[0].id === id,
	};
}

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
	client: DbClient = pool,
): Promise<ProjectStage> {
	const result = await client.query<ProjectStage>(
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
