import { Router } from "express";
import {
  createPostByUserId,
  deletePost,
  getAllPosts,
  getFilteredPosts,
  getTopPostsByLikes,
  updatePost,
} from "../controllers/post.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/", getAllPosts);
router.get('/top/likes', getTopPostsByLikes);

// Protected routes
router.use(isAuthenticated);

router.post("/filter", getFilteredPosts);
router.post("/:userId", createPostByUserId);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);

export default router;
