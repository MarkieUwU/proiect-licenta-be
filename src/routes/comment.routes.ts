import { Router } from "express";
import {
  addCommentToPost,
  deleteComment,
  getPostComments,
  updateComment,
} from "../controllers/comment.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = Router();

router.use(isAuthenticated);

router.get("/:postId", getPostComments);
router.post("/:postId", addCommentToPost);
router.put("/:id", updateComment);
router.delete("/:id", deleteComment);

export default router;
