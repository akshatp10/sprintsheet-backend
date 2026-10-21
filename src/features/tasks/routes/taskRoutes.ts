import { Router } from "express";

const taskRouter = Router();

taskRouter.get("/", (req, res) => {
	res.json({ message: "Fetching all task" });
});

export default taskRouter;
