import { Router } from "express";
import {
  createLikeOnPost,
  deleteLike,
  getAllLikes,
  getIfLiked,
} from "../controllers/like.controller";

const router = Router();

router.get('/all', getAllLikes);

router.get("/:userId", getIfLiked);

router.post("/", createLikeOnPost);

router.delete("/", deleteLike);

export default router;
