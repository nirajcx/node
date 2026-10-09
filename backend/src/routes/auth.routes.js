import { Router } from "express";
import { notImplemented } from "../utils/notImplemented.js";
export default Router()
  .post("/register", notImplemented)
  .post("/login", notImplemented)
  .get("/me", notImplemented)
  .post("/logout", notImplemented);
// TODO: Replace stubs with validators, auth rate limiter, auth middleware and controllers.
