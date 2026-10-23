export interface UserSchema {
	id: string;
	name: string;
	email: string;
	password: string;
	createdAt: number;
	updatedAt: number;
}

export interface CreateUserInput {
	id: string;
	name: string;
	email: string;
	passwordHash: string;
	createdAt: number;
	updatedAt: number;
}

export interface CreateGoogleUserInput {
	id: string;
	name: string;
	email: string;
	googleId: string;
	createdAt: number;
	updatedAt: number;
}

export interface UserSummary {
	id: string;
	name: string;
}

export interface User extends UserSummary {
	email: string;
}
