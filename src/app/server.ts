import express from "express";
import { env } from "../config/env";
import appRouter from "../router/routes";

const app = express();
const PORT = env.port;

//Main working app
app.use(express.json());

// Importing main router to be used throughout app
app.use("/api", appRouter);

app.get("/", (_req, res) => {
	res.json({
		message: "SprintSheet API is running!",
	});
});
app.get("/health", (_req, res) => {
	res.json({
		status: 200,
		message: "HEALTH CHECK : OK [Sprintsheet API is running properly!]",
	});
});

app.listen(PORT, () => {
	console.log(`SprintSheet API running on http://localhost:${PORT}`);
});
