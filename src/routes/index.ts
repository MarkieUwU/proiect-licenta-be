import { Router } from "express";
import userRouter from "./userRouter";
import postRouter from "./postRouter";
import likeRouter from "./likeRouter";
import commentRouter from "./commentRouter";
import adminRouter from "./adminRouter";
import reportRouter from './reportRouter';
import notificationRouter from './notification.routes';

const routes = Router();

routes.use("/user", userRouter);
routes.use("/admin", adminRouter);
routes.use("/post", postRouter);
routes.use("/like", likeRouter);
routes.use("/comment", commentRouter);
routes.use('/report', reportRouter);
routes.use('/notifications', notificationRouter);

export default routes;
