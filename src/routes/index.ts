import { Router } from "express";
import userRouter from "./userRouter";
import postRouter from "./postRouter";
import likeRouter from "./likeRouter";
import commentRouter from "./commentRouter";

const routes = Router();

routes.use("/user", userRouter);
routes.use("/post", postRouter);
routes.use("/like", likeRouter);
routes.use("/comment", commentRouter);

export default routes;
