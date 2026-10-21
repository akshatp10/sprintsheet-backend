import { Router } from "express";

const taskCycleRouter = Router();

taskCycleRouter.get("/", (req, res) => {
	res.json({ message: "Fetching all taskCycle" });
});

export default taskCycleRouter;
