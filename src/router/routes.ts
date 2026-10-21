import { Router } from "express";
import userRouter from "../features/users/routes/userRoutes";
import cycleRouter from "../features/cycles/routes/cycleRoutes";
import projectRouter from "../features/project/routes/projectRoutes";
import stageRouter from "../features/stages/routes/stageRoutes";
import taskCycleRouter from "../features/taskCycles/routes/taskCycleRoutes";
import taskRouter from "../features/tasks/routes/taskRoutes";
import typesRouter from "../features/types/routes/typesRoutes";
import authRouter from "../features/auth/routes/authRoutes";

const appRouter = Router();

// Authentication router
appRouter.use("/auth", authRouter);

// Mount individual feature routers onto base paths
appRouter.use("/users", userRouter);
appRouter.use("/cycles", cycleRouter);
appRouter.use("/projects", projectRouter);
appRouter.use("/stages", stageRouter);
appRouter.use("/taskCycles", taskCycleRouter);
appRouter.use("/tasks", taskRouter);
appRouter.use("/types", typesRouter);

export default appRouter;
