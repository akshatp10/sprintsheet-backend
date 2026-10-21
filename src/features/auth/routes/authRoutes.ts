import { Router } from "express";
import {
	authLoginController,
	authRegisterController,
} from "../controller/authController";

const authRouter = Router();

authRouter.post("/login", authLoginController);

authRouter.post("/register", authRegisterController);

export default authRouter;
