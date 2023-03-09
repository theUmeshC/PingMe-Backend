import express from "express";
import {
  addFriend,
  addMessage,
  addUsersToGroup,
  getFriends,
  getGroups,
  getMessages,
  get_all_users,
  sendFile,
} from "../Controllers/ChatController.js";
import multer from "multer";

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const chatRouter = express.Router();

chatRouter.post("/getAllUsers", get_all_users);

chatRouter.post("/addFriend", addFriend);

chatRouter.post("/getFriends", getFriends);

chatRouter.post("/getMessages", getMessages);

chatRouter.post("/sendMessage", addMessage);

chatRouter.post("/addToGroup", addUsersToGroup);

chatRouter.post("/getGroups", getGroups);

chatRouter.post("/sendFile", upload.single("file"), sendFile);

export default chatRouter;
