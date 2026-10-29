import { Router } from "express";
import {
	authGoogleController,
	authLoginController,
	authLogoutController,
	authRefreshAccessTokenController,
	authRegisterController,
} from "../controller/authController";

const authRouter = Router();

authRouter.post("/login", authLoginController);

authRouter.post("/register", authRegisterController);

authRouter.post("/google", authGoogleController);

authRouter.post("/refresh", authRefreshAccessTokenController);

authRouter.post("/logout", authLogoutController);

export default authRouter;
