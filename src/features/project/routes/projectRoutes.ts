import { Router } from "express";

const projectRouter = Router();

projectRouter.get("/", (req, res) => {
	res.json({ message: "Fetching all project" });
});

export default projectRouter;
