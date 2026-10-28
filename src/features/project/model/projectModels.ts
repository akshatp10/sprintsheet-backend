import { randomUUID } from "node:crypto";
import { pool } from "@/db/pool";
import {
	BACKLOG_STAGE_NAME,
	CreateProjectInput,
	DEFAULT_TYPES,
} from "../types/project.types";
import {
	createProjectStage,
	findOrCreateStageByName,
	getProjectStages,
} from "@/features/stages/model/stagesModel";
import {
	createProjectType,
	findOrCreateTypeByName,
	getProjectTypes,
} from "@/features/types/model/typesModels";

const PROJECT_COLUMNS = `
	p.id, p.name, p.description,
	p.cycle_length AS "cycleLength", p.starting_day AS "startingDay",
	p.auto_cycle AS "autoCycle", p.is_archived AS "isArchived",
	p.created_at AS "createdAt", p.updated_at AS "updatedAt"
`;

const validateStages = (stages: CreateProjectInput["stages"]) => {
	const names = stages.map((s) => s.name);

	if (!names.includes(BACKLOG_STAGE_NAME)) {
		throw new Error(`A project needs a "${BACKLOG_STAGE_NAME}" stage`);
	}
	if (new Set(names).size !== names.length) {
		throw new Error("Stage names must be unique within a project");
	}
	if (names[names.length - 1] === BACKLOG_STAGE_NAME) {
		throw new Error(`"${BACKLOG_STAGE_NAME}" cannot be the last stage`);
	}
};

export async function createProject(
	ownerId: string,
	input: CreateProjectInput,
) {
	validateStages(input.stages);

	const now = Date.now();
	const projectId = randomUUID();

	const client = await pool.connect();
	let transactionStarted = false;

	try {
		await client.query("BEGIN");
		transactionStarted = true;

		// 1. Create project
		const { rows } = await client.query(
			`INSERT INTO projects
                (
                    id, key, next_task_number, name, description,
                    cycle_length, starting_day, auto_cycle,
                    is_archived, created_at, updated_at
                )
             VALUES ($1, $2, 1, $3, $4, $5, $6, $7, FALSE, $8, $8)
             RETURNING
                id,
                key,
                next_task_number AS "nextTaskNumber",
                name,
                description,
                cycle_length AS "cycleLength",
                starting_day AS "startingDay",
                auto_cycle AS "autoCycle",
                is_archived AS "isArchived",
                created_at AS "createdAt",
                updated_at AS "updatedAt"`,
			[
				projectId,
				input.key,
				input.name,
				input.description ?? "",
				input.cycleLength,
				input.startingDay ?? "",
				input.autoCycle,
				now,
			],
		);

		// 2. Add owner as admin
		await client.query(
			`INSERT INTO project_members
                (
                    id, project_id, user_id, role,
                    created_at, updated_at
                )
             VALUES ($1, $2, $3, 'admin', $4, $4)`,
			[randomUUID(), projectId, ownerId, now],
		);

		// TODO: Handle invitations

		// 3. Create/reuse stages and map them to the project
		for (const [index, stageInput] of input.stages.entries()) {
			const { stage } = await findOrCreateStageByName(
				stageInput.name,
				now,
				client,
			);

			await createProjectStage(
				{
					id: randomUUID(),
					project_id: projectId,
					stage_id: stage.id,
					order: index,
					name: stage.name,
					is_terminal: index === input.stages.length - 1,
					createdAt: now,
					updatedAt: now,
				},
				client,
			);
		}

		// 4. Create/reuse default types and map them to the project
		for (const typeName of DEFAULT_TYPES) {
			const { type } = await findOrCreateTypeByName(
				typeName,
				now,
				client,
			);

			await createProjectType(
				{
					id: randomUUID(),
					project_id: projectId,
					type_id: type.id,
					createdAt: now,
					updatedAt: now,
				},
				client,
			);
		}

		await client.query("COMMIT");
		transactionStarted = false;

		return rows[0];
	} catch (error) {
		if (transactionStarted) {
			try {
				await client.query("ROLLBACK");
			} catch (rollbackError) {
				console.error(
					"Failed to roll back project creation:",
					rollbackError,
				);
			}
		}

		throw error;
	} finally {
		client.release();
	}
}

export async function getProjectMembers(projectId: string) {
	const { rows } = await pool.query(
		`SELECT pm.id, pm.project_id AS "projectId", pm.user_id AS "userId",
		        pm.role, u.name
		 FROM project_members pm
		 JOIN users u ON u.id = pm.user_id
		 WHERE pm.project_id = $1
		 ORDER BY pm.created_at ASC`,
		[projectId],
	);
	return rows;
}
export async function getAllProjectsByUser({
	userId,
	includeArchived = false,
}: {
	userId: string;
	includeArchived?: boolean;
}) {
	const { rows } = await pool.query(
		`SELECT ${PROJECT_COLUMNS},
		        COALESCE(
		          json_agg(
		            json_build_object(
		              'id', pm.id,
		              'projectId', pm.project_id,
		              'userId', pm.user_id,
		              'role', pm.role,
		              'name', u.name
		            ) ORDER BY pm.created_at
		          ), '[]'::json
		        ) AS members
		 FROM projects p
		 JOIN project_members me ON me.project_id = p.id AND me.user_id = $1
		 JOIN project_members pm ON pm.project_id = p.id
		 JOIN users u ON u.id = pm.user_id
		 WHERE ($2::boolean OR p.is_archived = FALSE)
		 GROUP BY p.id
		 ORDER BY p.created_at DESC`,
		[userId, includeArchived],
	);
	return rows;
}

export async function getProjectDetailsById(projectId: string, userId: string) {
	const { rows } = await pool.query(
		`SELECT ${PROJECT_COLUMNS}
		 FROM projects p
		 WHERE p.id = $1
		   AND EXISTS (
		     SELECT 1 FROM project_members pm
		     WHERE pm.project_id = p.id AND pm.user_id = $2
		   )`,
		[projectId, userId],
	);
	const project = rows[0];
	if (!project) return undefined;

	const [members, stages, types] = await Promise.all([
		getProjectMembers(projectId),
		getProjectStages(projectId),
		getProjectTypes(projectId),
	]);

	return { ...project, members, stages, types };
}
