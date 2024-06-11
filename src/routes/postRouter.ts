import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.send("Post router works");
});

router.get("/:id");

router.post("/:userId");

router.put("/:id");

router.delete("/:id");

export default router;
