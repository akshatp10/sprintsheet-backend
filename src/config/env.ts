import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
	path: path.resolve(process.cwd(), ".env"),
});

function required(name: string): string {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

export const env = {
	nodeEnv: process.env.NODE_ENV ?? "development",
	port: Number(process.env.PORT ?? 5000),

	db: {
		host: required("DB_HOST"),
		port: Number(required("DB_PORT")),
		name: required("DB_NAME"),
		user: required("DB_USER"),
		password: required("DB_PASSWORD"),
	},
};
