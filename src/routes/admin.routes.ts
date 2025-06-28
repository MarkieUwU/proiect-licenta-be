import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { 
  getDashboardStats, 
  getUsers, 
  updateUserRole,
  getAdminPosts,
  updatePostStatus,
  getPostReports,
  getAllPostReports,
  getAdminComments,
  updateCommentStatus,
  getCommentReports,
  getAllCommentReports
} from '../controllers/admin.controller';
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

router.use(isAuthenticated, adminMiddleware);

// Dashboard routes
router.get("/dashboard/stats", getDashboardStats);

// User management routes
router.get("/users", getUsers);
router.patch("/users/:userId/role", updateUserRole);

// Post management routes
router.get("/posts", getAdminPosts);
router.patch("/posts/:id/status", updatePostStatus);
router.get("/posts/:postId/reports", getPostReports);
router.get("/reports/posts", getAllPostReports);

// Comment management routes
router.get("/comments", getAdminComments);
router.patch("/comments/:id/status", updateCommentStatus);
router.get("/comments/:id/reports", getCommentReports);
router.get("/reports/comments", getAllCommentReports);

export default router;
