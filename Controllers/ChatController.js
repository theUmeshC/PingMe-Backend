import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { config } from "dotenv";
import crypto from "crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

config();

const randomImageName = (bytes = 32) => crypto.randomBytes(16).toString("hex");

const bucketName = process.env.BUCKET_NAME;

import pool from "../utils/pool.js";
import { s3 } from "../index.js";

export const addFriend = async (req, res) => {
  const { senderId, receiverId } = req.body;

  const [connect] = (
    await pool.query(
      "SELECT * FROM friends where (sender_id = $1 and receiver_id =$2) or (sender_id = $2 and receiver_id =$1)",
      [senderId, receiverId]
    )
  ).rows;

  if (!connect) {
    const data = (
      await pool.query("INSERT INTO friends values($1, $2, $3)", [
        uuidv4(),
        senderId,
        receiverId,
      ])
    ).rows;

    res.json({ data, message: "added to friends list" });
  } else {
    res.json({ message: "already friends" });
  }
};

export const get_all_users = async (req, res) => {
  const { userId } = req.body;

  try {
    const users = (
      await pool.query("select * from users where user_id != $1", [userId])
    ).rows;
    res.json(users);
  } catch (error) {
    return res.error(error);
  }
};

export const getFriends = async (req, res) => {
  const { userId } = req.body;
  let friends = [];

  const data = (
    await pool.query(
      "select users.* , friends.chat_id from users inner join friends on users.user_id = friends.sender_id AND friends.receiver_id= $1",
      [userId]
    )
  ).rows;

  const receiverData = (
    await pool.query(
      "select users.* , friends.chat_id from users inner join friends on users.user_id = friends.receiver_id AND friends.sender_id= $1",
      [userId]
    )
  ).rows;

  friends = [...data, ...receiverData];
  res.json(friends);
};

export const getGroups = async (req, res) => {
  const { userId } = req.body;

  const response = (
    await pool.query(
      "select * from group_chat join group_friends  on group_chat.group_id = group_friends.group_id where user_id= $1",
      [userId]
    )
  ).rows;

  res.json(response);
};

export const getMessages = async (req, res) => {
  const { chatId } = req.body;

  const messages = (
    await pool.query("select * from chat where chat_id =$1", [chatId])
  ).rows;

  for (const message of messages) {
    if (message.file_url) {
      const getObjectParams = {
        Bucket: bucketName,
        Key: message.file_url,
      };
      const command = new GetObjectCommand(getObjectParams);

      const url = await getSignedUrl(s3, command, { expiresIn: 480000 });

      message.file_url = url;
    }
  }
  res.json(messages);
};

export const addMessage = async (req, res) => {
  const { chatId, senderId, message, sender_name } = req.body;

  await pool.query("insert into chat values($1, $2, $3, $4, $5)", [
    chatId,
    message,
    senderId,
    sender_name,
    new Date(),
  ]);

  const messages = (
    await pool.query("select * from chat where chat_id =$1", [chatId])
  ).rows;

  for (const message of messages) {
    if (message.file_url) {
      const getObjectParams = {
        Bucket: bucketName,
        Key: message.file_url,
      };
      const command = new GetObjectCommand(getObjectParams);

      const url = await getSignedUrl(s3, command, { expiresIn: 480000 });

      message.file_url = url;
    }
  }

  res.json(messages);
};

export const addUsersToGroup = async (req, res) => {
  const { gParticipants, groupName } = req.body;
  const groupId = uuidv4();

  await pool.query("INSERT INTO group_chat VALUES ($1, $2, $3)", [
    groupId,
    groupName,
    uuidv4(),
  ]);

  gParticipants.map(async (uid) => {
    await pool.query("INSERT INTO group_friends VALUES ($1, $2)", [
      uid.user_id,
      groupId,
    ]);
  });
};

export const sendFile = async (req, res) => {
  const { chatId, sender_name, sender_id } = req.body;

  const imageName = randomImageName();
  const type = req.file.mimetype.split("/")[0];

  const params = {
    Bucket: bucketName,
    Key: imageName,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  const command = new PutObjectCommand(params);

  await pool.query(
    "insert into chat(chat_id, file_url, sender_id, sender_name, type, timestamp) values($1, $2, $3, $4, $5, $6)",
    [chatId, imageName, sender_id, sender_name, type, new Date()]
  );

  await s3.send(command);
  const messages = (
    await pool.query("select * from chat where chat_id =$1", [chatId])
  ).rows;

  for (const message of messages) {
    if (message.file_url) {
      const getObjectParams = {
        Bucket: bucketName,
        Key: message.file_url,
      };
      const command = new GetObjectCommand(getObjectParams);

      const url = await getSignedUrl(s3, command, { expiresIn: 480000 });

      message.file_url = url;
    }
  }

  res.json(messages);
};
