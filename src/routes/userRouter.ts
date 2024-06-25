import { Router } from "express";
import {
  registerUser,
  deleteUser,
  getUserData,
  getUsersList,
  editProfile,
  getUserPosts,
  loginUser,
  getFilteredUsers,
} from "../controllers/user.controller";
import { validateRequestSchema } from "../middleware/validation-middleware";
import {
  loginUserValidationSchema,
  registerUserValidationSchema,
  updateUserValidationSchema,
} from "../schemas/user-validation-schema";

const router = Router();

router.get("/", getUsersList);

router.post("/filtered", getFilteredUsers);

router.post("/data", getUserData);

router.get("/posts/:id", getUserPosts);

router.post("/register", registerUser);

router.post("/login", loginUser);

router.put("/:id", editProfile);

router.delete("/:id", deleteUser);

export default router;
