import { Router } from "express";
import userRouter from "./user.routes";
import postRouter from "./post.routes";
import likeRouter from "./like.routes";
import commentRouter from "./comment.routes";
import adminRouter from "./admin.routes";
import reportRouter from './report.routes';
import notificationRouter from './notification.routes';
import healthcheckRouter from './healtcheck.routes';

const routes = Router();

routes.use("/user", userRouter);
routes.use("/admin", adminRouter);
routes.use("/post", postRouter);
routes.use("/like", likeRouter);
routes.use("/comment", commentRouter);
routes.use('/report', reportRouter);
routes.use('/notifications', notificationRouter);
routes.use('/healthcheck', healthcheckRouter);

export default routes;
