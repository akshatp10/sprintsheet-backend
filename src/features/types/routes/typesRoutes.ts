import { Router } from "express";

const typesRouter = Router();

typesRouter.get("/", (req, res) => {
	res.json({ message: "Fetching all types" });
});

export default typesRouter;
