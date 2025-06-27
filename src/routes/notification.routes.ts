import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller";

const router = Router();

router.use(isAuthenticated);

router.get("/", getNotifications);
router.patch("/:notificationId/read", markAsRead);
router.patch("/read-all", markAllAsRead);
router.delete("/:notificationId", deleteNotification);

export default router; 