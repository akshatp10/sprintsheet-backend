import express from "express";
import { env } from "../config/env";

const app = express();
const PORT = env.port;

app.use(express.json());

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
