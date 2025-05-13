import { Router } from "express";
import {
  addCommentToPost,
  deleteComment,
  getAllComments,
  getPostComments,
  updateComment,
} from "../controllers/comment.controller";

const router = Router();

router.get('/all', getAllComments);

router.get("/:postId", getPostComments);

router.post("/:postId", addCommentToPost);

router.put("/:id", updateComment);

router.delete("/:id", deleteComment);

export default router;
