import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import {
  registerUser,
  getUserDetails,
  getUsersList,
  editProfile,
  getUserPosts,
  loginUser,
  getConnections,
  removeConnection,
  acceptConnection,
  requestForConnection,
  getConnectionState,
  getSuggestions,
  getConnectionRequests,
  getAllConnections,
  getTopUsersByConnections,
  getTopUsersByPosts,
  getSettings,
  updateSettings,
  getGenderRatio,
  sendPasswordResetEmail,
  resetPassword,
  verifyResetToken,
} from "../controllers/user.controller";

const router = Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/password/reset/request", sendPasswordResetEmail);
router.get('/password/reset/token/verify/:token', verifyResetToken);
router.put('/password/reset/:userId', resetPassword);

// Protected routes
router.use(isAuthenticated);

router.get("/", getUsersList);
router.get('/posts/:id', getUserPosts);
router.post("/details", getUserDetails);
router.put("/:id", editProfile);
router.get("/connections/all", getAllConnections);
router.post("/connections/:id", getConnections);
router.get("/connections/requests/:id", getConnectionRequests);
router.post("/suggestions/:id", getSuggestions);
router.get('/connection/:userId/with/:connectionId', getConnectionState);
router.post("/connection/:userId/request/:connectionId", requestForConnection);
router.put("/connection/:userId/accept/:connectionId", acceptConnection);
router.delete("/connection/:userId/disconnect/:connectionId", removeConnection);
router.get('/settings/:userId', getSettings);
router.put('/settings/:userId', updateSettings);
router.get('/top/connections', getTopUsersByConnections);
router.get('/top/posts', getTopUsersByPosts);
router.get('/gender/ratio', getGenderRatio);

export default router;
