import { Router } from "express";

const stageRouter = Router();

stageRouter.get("/", (req, res) => {
	res.json({ message: "Fetching all stage" });
});

export default stageRouter;
