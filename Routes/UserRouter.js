import express from "express";
import { loginUser, logoutUser } from "../Controllers/UserController.js";
import { oktaAuthRequired } from "../middleware/jwtVerifier.js";

const userRouter = express.Router();

userRouter.post("/login", oktaAuthRequired, loginUser);

userRouter.post("/logout", oktaAuthRequired, logoutUser);

export default userRouter;
