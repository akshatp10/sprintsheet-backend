import { Router } from "express";
import {
	createTaskCycleController,
	deleteTaskCycleController,
	getTaskCycleController,
	getTaskCyclesByCycleController,
	getTaskCyclesByProjectController,
	getTaskCyclesByTaskController,
	moveTaskController,
	moveTasksController,
	updateTaskCycleStageController,
} from "../controller/taskCyclesControllers";

const taskCycleRouter = Router();

taskCycleRouter.post("/createTaskCycle", createTaskCycleController);

taskCycleRouter.patch("/updateTaskCycleStage", updateTaskCycleStageController);
taskCycleRouter.patch("/moveTask", moveTaskController);
taskCycleRouter.patch("/moveTasks", moveTasksController);

taskCycleRouter.get("/getTaskCycle", getTaskCycleController);
taskCycleRouter.get("/getTaskCyclesByCycle", getTaskCyclesByCycleController);
taskCycleRouter.get("/getTaskCyclesByTask", getTaskCyclesByTaskController);
taskCycleRouter.get(
	"/getTaskCyclesByProject",
	getTaskCyclesByProjectController,
);

taskCycleRouter.delete("/deleteTaskCycle", deleteTaskCycleController); // ?taskId=&taskCycleId=

export default taskCycleRouter;
