import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import {
  registerUser,
  getUserDetails,
  editProfile,
  loginUser,
  getConnections,
  removeConnection,
  acceptConnection,
  requestForConnection,
  getConnectionState,
  getSuggestions,
  getConnectionRequests,
  getAllConnections,
  getSettings,
  updateSettings,
  sendPasswordResetEmail,
  resetPassword,
  verifyResetToken,
} from "../controllers/user.controller";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/password/reset/request", sendPasswordResetEmail);
router.get('/password/reset/token/verify/:token', verifyResetToken);
router.put('/password/reset/:userId', resetPassword);

router.use(isAuthenticated);

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

export default router;
