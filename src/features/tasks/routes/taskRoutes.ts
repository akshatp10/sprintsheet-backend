import { Router } from "express";
import {
	createTaskController,
	getAllTasksController,
	getBacklogTasksController,
	getCycleTasksByProjectController,
	getTasksByCycleController,
	updateTaskController,
} from "../controller/tasksControllers";

const taskRouter = Router();

taskRouter.post("/createTask", createTaskController);

taskRouter.patch("/updateTask", updateTaskController);

taskRouter.get("/getAllTasks", getAllTasksController);
taskRouter.get("/getBacklogTasks", getBacklogTasksController);
taskRouter.get("/getCycleTasks", getTasksByCycleController);
taskRouter.get("/getProjectCycleTasks", getCycleTasksByProjectController);

export default taskRouter;
