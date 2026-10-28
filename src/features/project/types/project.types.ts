export const BACKLOG_STAGE_NAME = "Backlog";
export const DEFAULT_TYPES = [
	"task",
	"bug",
	"feature",
	"improvement",
	"refactor",
	"migration",
	"update",
];

export type CycleLength = "default" | "custom" | "nocycle";

export type ProjectRole = "member" | "admin";

export interface CreateProjectInput {
	key: string;
	name: string;
	description?: string;
	cycleLength: CycleLength;
	startingDay?: string;
	autoCycle: boolean;
	stages: { name: string }[];
	invitedPeople?: {
		email: string;
		role: ProjectRole;
	}[];
}
