import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { 
  getDashboardStats, 
  getUsers, 
  updateUserRole,
  getAdminPosts,
  updatePostStatus,
  getPostReports,
  getAdminComments,
  updateCommentStatus,
  getCommentReports
} from '../controllers/admin.controller';
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

router.use(isAuthenticated, adminMiddleware);

// Dashboard routes
router.get("/dashboard/stats", getDashboardStats);

// User management routes
router.get("/users", getUsers);
router.patch("/users/:id/role", updateUserRole);

// Post management routes
router.get("/posts", getAdminPosts);
router.patch("/posts/:id/status", updatePostStatus);
router.get("/posts/:postId/reports", getPostReports);

// Comment management routes
router.get("/comments", getAdminComments);
router.patch("/comments/:id/status", updateCommentStatus);
router.get("/comments/:id/reports", getCommentReports);

export default router;
