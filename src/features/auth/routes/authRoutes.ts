import { Router } from "express";
import {
	authGoogleController,
	authLoginController,
	authRegisterController,
} from "../controller/authController";

const authRouter = Router();

authRouter.post("/login", authLoginController);

authRouter.post("/register", authRegisterController);

authRouter.post("/google", authGoogleController);

export default authRouter;
