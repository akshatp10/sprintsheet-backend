import { pool } from "@/db/pool";
import type {
	CreateProjectTypesInput,
	CreateTypesInput,
	ProjectTypes,
	Types,
} from "../types/types";
import { Pool, PoolClient } from "pg";
import { randomUUID } from "node:crypto";

type DbClient = Pool | PoolClient;

export async function findOrCreateTypeByName(
	name: string,
	now: number = Date.now(),
	client: DbClient = pool as unknown as DbClient,
): Promise<{ type: Types; created: boolean }> {
	const id = randomUUID();

	const result = await client.query<Types>(
		`INSERT INTO types (
            id, name, created_at, updated_at
        )
        VALUES ($1, $2, $3, $3)
        ON CONFLICT (name)
        DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name`,
		[id, name, now],
	);

	return {
		type: result.rows[0],
		created: result.rows[0].id === id,
	};
}

export async function findTypeByName(
	typeName: string,
): Promise<Types | undefined> {
	const result = await pool.query<Types>(
		`SELECT id, name
     FROM types
     WHERE name = $1`,
		[typeName],
	);

	return result.rows[0];
}

export async function createTypeByName(
	input: CreateTypesInput,
): Promise<Types> {
	const result = await pool.query<Types>(
		`INSERT INTO types (
       id, name, created_at, updated_at
     )
     VALUES ($1, $2, $3, $4)
     RETURNING id, name`,
		[input.id, input.name, input.createdAt, input.updatedAt],
	);

	return result.rows[0];
}

export async function createProjectType(
	input: CreateProjectTypesInput,
	client: DbClient = pool,
): Promise<ProjectTypes> {
	const result = await client.query<ProjectTypes>(
		`INSERT INTO project_types (
            id, project_id, type_id, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
            id,
            project_id AS "projectId",
            type_id AS "typeId"`,
		[
			input.id,
			input.project_id,
			input.type_id,
			input.createdAt,
			input.updatedAt,
		],
	);

	return result.rows[0];
}

export async function getProjectTypes(projectId: string): Promise<Types[]> {
	const result = await pool.query<Types>(
		`SELECT t.id, t.name
     FROM project_types pt
     INNER JOIN types t
       ON t.id = pt.type_id
     WHERE pt.project_id = $1
     ORDER BY t.name ASC`,
		[projectId],
	);

	return result.rows;
}

export async function getTypeById(id: string): Promise<Types | undefined> {
	const result = await pool.query<Types>(
		`SELECT id, name
     FROM types
     WHERE id = $1`,
		[id],
	);

	return result.rows[0];
}
export async function getAllTypes(): Promise<Types[] | undefined> {
	const result = await pool.query<Types>(
		`SELECT id, name
     FROM types`,
	);

	return result.rows;
}
