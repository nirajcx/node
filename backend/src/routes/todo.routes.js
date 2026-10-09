import { Router } from "express";
import { notImplemented } from "../utils/notImplemented.js";
export default Router()
  .get("/", notImplemented)
  .post("/", notImplemented)
  .patch("/:id", notImplemented)
  .delete("/:id", notImplemented);
// TODO: router.use(requireAuth) BEFORE all todo routes; then validation + controller.
