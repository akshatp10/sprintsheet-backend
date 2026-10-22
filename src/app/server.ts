import express from "express";
import { env } from "../config/env";
import appRouter from "../router/routes";
import { initDatabaseTable } from "../db/init";
import bodyParser from "body-parser";
import { errorHandler } from "@/utils/errorHandler";

const app = express();
const PORT = env.port;

//Main working app
app.use(express.json());
initDatabaseTable();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Importing main router to be used throughout app
app.use("/api", appRouter);

// Handling all the errors
app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`SprintSheet API running on http://localhost:${PORT}`);
});
