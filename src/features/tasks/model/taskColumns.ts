export const taskColumns = (alias = "") => {
	const p = alias ? `${alias}.` : "";
	return `
		${p}id, ${p}key, ${p}project_id AS "projectId", ${p}type_id AS "typeId",
		${p}name, ${p}description, ${p}assignee_ids AS "assigneeIds",
		${p}due_date AS "dueDate", ${p}tags, ${p}is_backlog::int AS "isBacklog",
		${p}created_at AS "createdAt", ${p}updated_at AS "updatedAt"`;
};

// Expects the tasks table aliased as `t`. Assignees are summaries (id + name).
export const ASSIGNEES_SQL = `
	COALESCE((
	  SELECT json_agg(json_build_object('id', u.id, 'name', u.name)
	                  ORDER BY array_position(t.assignee_ids, u.id))
	  FROM users u WHERE u.id = ANY(t.assignee_ids)
	), '[]'::json) AS assignees`;

export const stageJson = (a: string) => `json_build_object(
	'id', ${a}.id, 'projectId', ${a}.project_id, 'stageId', ${a}.stage_id,
	'order', ${a}."order", 'name', ${a}.name, 'isTerminal', ${a}.is_terminal)`;
