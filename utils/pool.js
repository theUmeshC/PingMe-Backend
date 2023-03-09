import pg from "pg";
import { config } from "dotenv";

config();

const Pool = pg.Pool;

// production database

const pool = new Pool({
  user: "postgres",
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOSTNAME,
  port: 5432,
  database: "database_pingme",
  multipleStatements: true,
});

// dev 

// const pool = new Pool({
//   user: "postgres",
//   password: process.env.DATABASE_DEV_PASSWORD,
//   host: process.env.DATABASE_DEV_HOSTNAME,
//   port: 5432,
//   database: "PingMe-db",
//   multipleStatements: true,
// });

export default pool;
