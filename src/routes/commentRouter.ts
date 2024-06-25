import { Router } from "express";
import {
  addCommentToPost,
  deleteComment,
  updateComment,
} from "../controllers/comment.controller";

const router = Router();

router.post("/:postId", addCommentToPost);

router.put("/:id", updateComment);

router.delete("/:id", deleteComment);

export default router;
