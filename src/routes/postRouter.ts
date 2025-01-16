import { Router } from "express";
import {
  createPostByUserId,
  deletePost,
  getAllPosts,
  getFilteredPosts,
  getPostById,
  getPostLikes,
  updatePost,
} from "../controllers/post.controller";

const router = Router();

router.get("/", getAllPosts);

router.post("/filter", getFilteredPosts);

router.get("/:id", getPostById);

router.get("/likes/:id", getPostLikes);

router.post("/:userId", createPostByUserId);

router.put("/:id", updatePost);

router.delete("/:id", deletePost);

export default router;
