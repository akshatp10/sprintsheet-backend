import { Router } from "express";
import {
	createCycleController,
	getAllCyclesController,
	getCycleController,
	updateCycleController,
} from "../controller/cyclesController";

const cycleRouter = Router();

cycleRouter.get("/getCycle", getCycleController);
cycleRouter.get("/getAllCycles", getAllCyclesController);
cycleRouter.post("/createCycle", createCycleController);
cycleRouter.patch("/updateCycle", updateCycleController);
// cycleRouter.delete("/deleteCycle", deleteCycleController);

export default cycleRouter;
