import { Router } from "express";
import {
  createLikeOnPost,
  deleteLike,
} from "../controllers/like.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = Router();

router.use(isAuthenticated);

router.post("/", createLikeOnPost);
router.delete("/", deleteLike);

export default router;
