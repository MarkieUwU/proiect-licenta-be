import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getAllUsers,
  updateUser,
  getUserPosts,
} from "../controllers/user.controller";
import { validateRequestSchema } from "../middleware/validation-middleware";
import {
  createUserValidationSchema,
  updateUserValidationSchema,
} from "../schemas/user-validation-schema";

const router = Router();

router.get("/", getAllUsers);

router.get("/:id", getUserById);

router.get("/posts/:id", getUserPosts);

router.post("/", createUserValidationSchema, validateRequestSchema, createUser);

router.put(
  "/:id",
  updateUserValidationSchema,
  validateRequestSchema,
  updateUser
);

router.delete("/:id", deleteUser);

export default router;
