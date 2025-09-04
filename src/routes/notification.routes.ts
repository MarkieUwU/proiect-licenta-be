import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import {
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadNotifications,
  getNotificationsCount,
} from "../controllers/notification.controller";

const router = Router();

router.use(isAuthenticated);

router.get("/", getAllNotifications);
router.get("/unread", getUnreadNotifications);
router.get("/count", getNotificationsCount);
router.patch("/:notificationId/read", markAsRead);
router.patch("/read-all", markAllAsRead);
router.delete("/:notificationId", deleteNotification);

export default router; 