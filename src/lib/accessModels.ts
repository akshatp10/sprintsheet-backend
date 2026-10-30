import { pool, type Queryable } from "@/db/pool";

export async function isProjectMember(
	projectId: string,
	userId: string,
	db: Queryable = pool,
): Promise<boolean> {
	const { rowCount } = await db.query(
		`SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
		[projectId, userId],
	);
	return (rowCount ?? 0) > 0;
}

// Returns the cycle's projectId, or undefined if missing / user isn't a member.
export async function getCycleProjectIdForMember(
	cycleId: string,
	userId: string,
	db: Queryable = pool,
): Promise<string | undefined> {
	const { rows } = await db.query<{ projectId: string }>(
		`SELECT c.project_id AS "projectId" FROM cycles c
		 WHERE c.id = $1
		   AND EXISTS (SELECT 1 FROM project_members pm
		               WHERE pm.project_id = c.project_id AND pm.user_id = $2)`,
		[cycleId, userId],
	);
	return rows[0]?.projectId;
}

export async function getTaskProjectIdForMember(
	taskId: string,
	userId: string,
	db: Queryable = pool,
): Promise<string | undefined> {
	const { rows } = await db.query<{ projectId: string }>(
		`SELECT t.project_id AS "projectId" FROM tasks t
		 WHERE t.id = $1
		   AND EXISTS (SELECT 1 FROM project_members pm
		               WHERE pm.project_id = t.project_id AND pm.user_id = $2)`,
		[taskId, userId],
	);
	return rows[0]?.projectId;
}
