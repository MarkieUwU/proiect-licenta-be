import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { 
  getDashboardStats, 
  getUsers, 
  updateUserRole,
  getAdminPosts,
  updatePostStatus,
  getAllPostReports,
  getAdminComments,
  updateCommentStatus,
  getAllCommentReports
} from '../controllers/admin.controller';
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

router.use(isAuthenticated, adminMiddleware);

router.get("/dashboard/stats", getDashboardStats);

router.get("/users", getUsers);
router.patch("/users/:userId/role", updateUserRole);

router.get("/posts", getAdminPosts);
router.patch("/posts/:id/status", updatePostStatus);
router.get("/reports/posts", getAllPostReports);

router.get("/comments", getAdminComments);
router.patch("/comments/:id/status", updateCommentStatus);
router.get("/reports/comments", getAllCommentReports);

export default router;
