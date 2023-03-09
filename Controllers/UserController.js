import { v4 as uuidv4 } from "uuid";

import pool from "../utils/pool.js";

export const loginUser = async (req, res) => {
  const { user } = req.body;
  const uEmail = user.email;
  try {
    const databaseUser = (
      await pool.query("select username from users where email = $1", [uEmail])
    ).rows;
    
    if (databaseUser.length > 0) {
      await pool.query("UPDATE users SET status = $1 where email=$2", [
        "online",
        uEmail,
      ]);
      const [userDb] = (
        await pool.query("select * from users where email = $1", [uEmail])
      ).rows;
      res.json(userDb);
    } else {
      await pool.query("Insert into users values($1, $2, $3, $4, $5, $6)", [
        uuidv4(),
        user.name,
        user.given_name,
        user.family_name,
        user.email,
        "offline",
      ]);
      const [userDb] = (
        await pool.query("select * from users where email = $1", [uEmail])
      ).rows;
      res.json(userDb);
    }
  } catch (error) {
    res.status(401).json({ err: "server error" });
  }
};

export const logoutUser = async (req, res) => {
  const { userId } = req.body;
  try {
    await pool.query("UPDATE users SET status = $1 where user_id=$2", [
      "offline",
      userId,
    ]);
    res.json("logged out");
  } catch (error) {
    res.status(401).json({ err: "server error" });
  }
};
