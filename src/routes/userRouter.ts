import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/user.controller";
import { validateRequestSchema } from "../middleware/validation-middleware";
import {
  createUserValidationSchema,
  updateUserValidationSchema,
} from "../schemas/user-validation-schema";

const router = Router();

router.get("/", getUsers);

router.get("/:id", getUserById);

router.post("/", createUserValidationSchema, validateRequestSchema, createUser);

router.put(
  "/:id",
  updateUserValidationSchema,
  validateRequestSchema,
  updateUser
);

router.delete("/:id", deleteUser);

export default router;
