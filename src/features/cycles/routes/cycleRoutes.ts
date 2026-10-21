import { Router } from "express";

const cycleRouter = Router();

cycleRouter.get("/", (req, res) => {
	res.json({ message: "Fetching all cycles" });
});

export default cycleRouter;
