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
		url: required("DATABASE_URL"),
		ssl: process.env.DB_SSL === "true",
		autoCreateDatabase: process.env.DB_AUTO_CREATE_DATABASE === "true",
	},

	jwt: {
		jwt_secret: required("JWT_SECRET"),
		jwt_expiry: required("JWT_EXPIRES_IN"),
		jwt_refresh_expiry: required("JWT_REFRESH_EXPIRES_IN"),
	},

	google_id: process.env.GOOGLE_CLIENT_ID,

	fe_url: required("FRONTEND_URL"),
};
