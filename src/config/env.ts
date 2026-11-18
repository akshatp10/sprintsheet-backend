import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
	path: path.resolve(process.cwd(), ".env"),
});

const MAIL_TRANSPORTS = ["console", "brevo"] as const;

const mailTransport =
	process.env.MAIL_TRANSPORT ??
	(process.env.NODE_ENV === "production" ? undefined : "console");

if (
	!mailTransport ||
	!MAIL_TRANSPORTS.includes(mailTransport as (typeof MAIL_TRANSPORTS)[number])
) {
	throw new Error(
		`Invalid MAIL_TRANSPORT: ${mailTransport ?? "not configured"}. Supported transports: ${MAIL_TRANSPORTS.join(", ")}`,
	);
}

if (mailTransport === "brevo") {
	required("BREVO_API_KEY");
	required("MAIL_FROM");
}

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
		transport: mailTransport,
		apiKey: process.env.BREVO_API_KEY,
		from: process.env.MAIL_FROM,
	},
};
