import { Router } from "express";
import {
	createProjectStageController,
	findOrCreateStageController,
	getAllStagesController,
	getProjectStagesController,
	getStageByIdController,
} from "../controller/stagesControllers";

const stageRouter = Router();

stageRouter.post("/getStage", findOrCreateStageController);
stageRouter.post("/createProjectStage", createProjectStageController);
stageRouter.post("/getAllProjectStages", getProjectStagesController);
stageRouter.post("/getStageById", getStageByIdController);
stageRouter.get("/getAllStages", getAllStagesController);

export default stageRouter;
