import express from "express";
import cors from "cors";

import { env } from "../config/env";
import appRouter from "../router/routes";
import { initDatabaseTable } from "../db/init";
import { errorHandler } from "@/utils/errorHandler";

const app = express();
const PORT = env.port;

const corsOptions: cors.CorsOptions = {
	origin: "http://localhost:5173",
	credentials: true,
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", appRouter);

// Keep the error handler after routes.
app.use(errorHandler);

initDatabaseTable();

app.listen(PORT, () => {
	console.log(`SprintSheet API running on http://localhost:${PORT}`);
});
