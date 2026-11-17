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

	mail: {
		transport: process.env.MAIL_TRANSPORT ?? "console",
		apiKey: process.env.BREVO_API_KEY,
		from: process.env.MAIL_FROM,
	},
};

if (env.mail.transport === "smtp") {
	for (const name of ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"]) {
		required(name);
	}
}

if (env.mail.transport === "resend") {
	required("RESEND_API_KEY");
	required("MAIL_FROM");
}

if (env.mail.transport === "brevo") {
	required("BREVO_API_KEY");
	required("MAIL_FROM");
}
