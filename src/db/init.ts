import { readFile } from "node:fs/promises";
import { Client } from "pg";

import { env } from "../config/env";
import { pool } from "./pool";

export async function initDatabaseTable(): Promise<void> {
	const admin = new Client({
		host: env.db.host,
		port: env.db.port,
		user: env.db.user,
		password: env.db.password,
		database: "postgres",
	});

	try {
		await admin.connect();

		const result = await admin.query(
			"SELECT 1 FROM pg_database WHERE datname = $1",
			[env.db.name],
		);

		if (result.rowCount === 0) {
			const name = `"${env.db.name.replace(/"/g, '""')}"`;
			await admin.query(`CREATE DATABASE ${name}`);
			console.log(`Created database ${env.db.name}`);
		}
	} finally {
		await admin.end();
	}

	const schema = await readFile("src/db/schema.sql", "utf8");
	await pool.query(schema);

	console.log("PostgreSQL schema is ready.");
}
