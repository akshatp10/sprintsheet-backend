import { Router } from "express";
import {
	getUsersByProjectController,
	getUserController,
} from "../controller/usersControllers";

const userRouter = Router();

userRouter.get("/", getUserController);
userRouter.get("/project", getUsersByProjectController);

export default userRouter;
