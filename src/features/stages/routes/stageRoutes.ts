import { Router } from "express";
import {
	createProjectStageController,
	findOrCreateStageController,
	getProjectStagesController,
} from "../controller/stagesControllers";

const stageRouter = Router();

stageRouter.post("/getStage", findOrCreateStageController);

stageRouter.post("/createProjectStage", createProjectStageController);

stageRouter.post("/getAllProjectStages", getProjectStagesController);

export default stageRouter;
