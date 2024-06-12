import { Router } from "express";
import { createLikeOnPost, deleteLike } from "../controllers/like.controller";

const router = Router();

router.post("/", createLikeOnPost);

router.delete("/:id", deleteLike);

export default router;
