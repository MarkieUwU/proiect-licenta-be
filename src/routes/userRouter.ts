import { Router } from "express";
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
} from "../controllers/user.controller";

const router = Router();

router.get("/", getUsersList);

router.get('/posts/:id', getUserPosts);

router.post("/details", getUserDetails);

router.post("/register", registerUser);

router.post("/login", loginUser);

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
