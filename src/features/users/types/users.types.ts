export interface CreateUserInput {
	id: string;
	name: string;
	email: string;
	passwordHash: string;
	createdAt: number;
	updatedAt: number;
}
