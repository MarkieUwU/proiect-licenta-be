import { Router } from "express";
import userRouter from "./userRouter";
import postRouter from "./postRouter";
import likeRouter from "./likeRouter";
import commentRouter from "./commentRouter";
import adminRouter from "./adminRouter";

const routes = Router();

routes.use("/user", userRouter);
routes.use("/admin", adminRouter);
routes.use("/post", postRouter);
routes.use("/like", likeRouter);
routes.use("/comment", commentRouter);

export default routes;
