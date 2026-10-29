import { Pool, PoolClient } from "pg";
import { env } from "../config/env";

export type Queryable = Pick<PoolClient, "query">;

export const pool = new Pool({
	host: env.db.host,
	port: env.db.port,
	database: env.db.name,
	user: env.db.user,
	password: env.db.password,
});

pool.on("error", (error) => {
	console.error("Unexpected PostgreSQL pool error:", error);
});
