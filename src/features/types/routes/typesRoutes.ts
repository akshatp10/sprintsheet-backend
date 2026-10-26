import { Router } from "express";
import {
	createProjectTypesController,
	findOrCreateTypesController,
	getAllTypesController,
	getProjectTypesController,
	getTypeByIdController,
} from "../controller/typesControllers";

const typesRouter = Router();

typesRouter.post("/getTypes", findOrCreateTypesController);
typesRouter.post("/createProjectTypes", createProjectTypesController);
typesRouter.post("/getAllProjectSTypes", getProjectTypesController);
typesRouter.post("/getTypeById", getTypeByIdController);
typesRouter.get("/getAllTypes", getAllTypesController);

export default typesRouter;
