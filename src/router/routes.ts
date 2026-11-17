import { Router } from "express";
import userRouter from "../features/users/routes/userRoutes";
import cycleRouter from "../features/cycles/routes/cycleRoutes";
import projectRouter from "../features/project/routes/projectRoutes";
import stageRouter from "../features/stages/routes/stageRoutes";
import taskCycleRouter from "../features/taskCycles/routes/taskCyclesRoutes";
import taskRouter from "../features/tasks/routes/taskRoutes";
import typesRouter from "../features/types/routes/typesRoutes";
import authRouter from "../features/auth/routes/authRoutes";
import { requireAuth } from "@/middleware/authMiddlewares";
import invitationRouter, {
	invitationPublicRouter,
} from "@/features/invites/routes/invitationRoutes";

const appRouter = Router();

// Authentication router
appRouter.use("/auth", authRouter);
appRouter.use("/invitations", invitationPublicRouter);

// Middleware to validate the token
appRouter.use(requireAuth);

// Mount individual feature routers onto base paths
appRouter.use("/users", userRouter);
appRouter.use("/cycles", cycleRouter);
appRouter.use("/projects", projectRouter);
appRouter.use("/stages", stageRouter);
appRouter.use("/taskCycles", taskCycleRouter);
appRouter.use("/tasks", taskRouter);
appRouter.use("/types", typesRouter);
appRouter.use("/invitations", invitationRouter);

export default appRouter;
