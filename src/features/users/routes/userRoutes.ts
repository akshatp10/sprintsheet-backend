import { Router } from "express";
import {
	getUserByIdController,
	getUsersByIdsController,
	getUsersByProjectController,
	getUserController,
} from "../controller/usersControllers";

const userRouter = Router();

userRouter.get("/", getUserController);
userRouter.get("/byId", getUserByIdController);
userRouter.get("/byIds", getUsersByIdsController);
userRouter.get("/project", getUsersByProjectController);

export default userRouter;
