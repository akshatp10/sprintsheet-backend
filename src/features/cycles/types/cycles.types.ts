export interface Cycle {
	id: string;
	projectId: string;
	name: string;
	startDate: string; // YYYY-MM-DD
	endDate: string;
	createdAt: number;
	updatedAt: number;
}

export interface CreateCycleInput {
	projectId: string;
	name: string;
	startDate: string;
	endDate: string;
}

export type UpdateCycleFields = Partial<
	Pick<Cycle, "name" | "startDate" | "endDate">
>;

export interface UpdateCycleInput {
	id: string;
	updates: UpdateCycleFields;
}

// Model results, so the service decides the HTTP errors
export type CreateCycleResult =
	| { status: "ok"; cycle: Cycle }
	| { status: "project_not_found" }
	| { status: "overlap" };

export type UpdateCycleResult =
	| { status: "ok"; cycle: Cycle }
	| { status: "not_found" }
	| { status: "invalid_dates" }
	| { status: "overlap" };
