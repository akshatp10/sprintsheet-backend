import { Pool, type PoolClient } from "pg";
import pg from "pg";
import { env } from "../config/env";

export type Queryable = Pick<PoolClient, "query">;

pg.types.setTypeParser(1082, (value: string) => value);

export const pool = new Pool({
	connectionString: env.db.url,
	ssl: env.db.ssl ? { rejectUnauthorized: false } : undefined,
	max: 10,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 10000,
});

pool.on("error", (error) => {
	console.error("Unexpected PostgreSQL pool error:", error);
});
