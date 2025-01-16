import { Router } from "express";
import {
  registerUser,
  deleteUser,
  getUserDetails,
  getUsersList,
  editProfile,
  getUserPosts,
  loginUser,
  getFilteredUsers,
  getConnections,
  removeConnection,
  acceptConnection,
  requestForConnection,
  getConnectionState,
  getSuggestions,
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

router.post("/details", getUserDetails);

router.get("/posts/:id", getUserPosts);

router.post("/register", registerUser);

router.post("/login", loginUser);

router.put("/:id", editProfile);

router.delete("/:id", deleteUser);

router.post("/connections/:id", getConnections);

router.get('/suggestions/:id', getSuggestions);

router.get('/connection/:userId/with/:connectionId', getConnectionState);

router.post("/connection/:userId/request/:connectionId", requestForConnection);

router.put("/connection/:userId/accept/:connectionId", acceptConnection);

router.delete("/connection/:userId/disconnect/:connectionId", removeConnection);

export default router;
