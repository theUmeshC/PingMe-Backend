import express from "express";
import cors from "cors";
import { config } from "dotenv";
import bodyParser from "body-parser";
import http from "http";
import { Server } from "socket.io";
import { S3Client } from "@aws-sdk/client-s3";

import chatRouter from "./Routes/ChatRoutes.js";
import { oktaAuthRequired } from "./middleware/jwtVerifier.js";
import userRouter from "./Routes/UserRouter.js";

config();

const secretAccessKey = process.env.SECRET_ACCESS_KEY;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;

export const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion
})

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});


io.on("connection", (socket) => {
  socket.on("login", (userID) => {
    socket.join(userID);
    socket.emit("connected to socket");
  });

  socket.on("join room", (chatId) => {
    socket.join(chatId);
  });

  socket.on("leave room", (chatId) => {
    socket.leave(chatId);
  });

  socket.on("send message", (newMessage, chatId, senderId, sender_name) => {
    socket
      .to(chatId)
      .emit("receive message", {
        newMessage,
        senderId,
        timestamp: new Date(),
        sender_name,
      });
  });
});

const port = process.env.PORT || "6000";

app.use(bodyParser.json());

app.use(
  cors({
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json());

app.use("/users", userRouter);

app.use("/chat", oktaAuthRequired, chatRouter);

server.listen(port, () => {
  console.log(port);
});
