import { readFile } from "node:fs/promises";
import { Client } from "pg";

import { env } from "../config/env";
import { pool } from "./pool";

export async function initDatabaseTable(): Promise<void> {
	const databaseUrl = new URL(env.db.url);
	const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));

	// Create database automatically when enabled
	if (env.db.autoCreateDatabase) {
		const adminUrl = new URL(databaseUrl);
		adminUrl.pathname = "/postgres";

		const admin = new Client({
			connectionString: adminUrl.toString(),
			ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined,
		});

		try {
			await admin.connect();

			const result = await admin.query(
				"SELECT 1 FROM pg_database WHERE datname = $1",
				[databaseName],
			);

			if (result.rowCount === 0) {
				const safeName = `"${databaseName.replace(/"/g, '""')}"`;

				await admin.query(`CREATE DATABASE ${safeName}`);

				console.log(`Created database: ${databaseName}`);
			} else {
				console.log(`Database already exists: ${databaseName}`);
			}
		} finally {
			await admin.end();
		}
	}

	// Initialize schema using the application pool
	const schema = await readFile("src/db/schema.sql", "utf8");

	await pool.query(schema);

	console.log("PostgreSQL schema is ready.");
}
