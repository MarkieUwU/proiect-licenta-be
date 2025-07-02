import { Router } from "express";
import {
  createPostByUserId,
  deletePost,
  getFilteredPosts,
  updatePost,
} from "../controllers/post.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = Router();

router.use(isAuthenticated);

router.post("/filter", getFilteredPosts);
router.post("/:userId", createPostByUserId);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);

export default router;
