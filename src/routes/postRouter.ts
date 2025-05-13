import { Router } from "express";
import {
  createPostByUserId,
  deletePost,
  getAllPosts,
  getFilteredPosts,
  getTopPostsByLikes,
  updatePost,
} from "../controllers/post.controller";

const router = Router();

router.get("/", getAllPosts);

router.post("/filter", getFilteredPosts);

router.post("/:userId", createPostByUserId);

router.put("/:id", updatePost);

router.delete("/:id", deletePost);

router.get('/top/likes', getTopPostsByLikes);

export default router;
