import { Router } from "express";

const userRouter = Router();

userRouter.get("/", (req, res) => {
	res.json({ message: "Fetching all users" });
});

export default userRouter;
