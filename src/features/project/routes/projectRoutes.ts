import { Router } from "express";
import {
	createProjectController,
	getAllProjectByUsersController,
	getProjectByIdController,
} from "../controller/projectControllers";

const projectRouter = Router();

projectRouter.post("/createProject", createProjectController);
projectRouter.get("/projectById", getProjectByIdController);
projectRouter.get("/allProjectByUsers", getAllProjectByUsersController);

export default projectRouter;
