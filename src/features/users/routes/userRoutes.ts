import { Router } from "express";
import {
	getUserByIdController,
	getUsersByIdsController,
	getUsersByProjectController,
} from "../controller/usersControllers";

const userRouter = Router();

userRouter.get("/byId", getUserByIdController);
userRouter.get("/byIds", getUsersByIdsController);
userRouter.get("/project", getUsersByProjectController);

export default userRouter;
