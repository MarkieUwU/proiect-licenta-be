import { Router } from "express";
import {
  addCommentToPost,
  deleteComment,
  getAllComments,
  getPostComments,
  updateComment,
} from "../controllers/comment.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.get('/all', getAllComments);
router.get("/:postId", getPostComments);

// Protected routes
router.use(isAuthenticated);

router.post("/:postId", addCommentToPost);
router.put("/:id", updateComment);
router.delete("/:id", deleteComment);

export default router;
