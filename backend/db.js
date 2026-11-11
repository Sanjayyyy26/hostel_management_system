const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:Sanjay@26@localhost:5432/hostellers";

const isRemote = Boolean(
  connectionString &&
  !connectionString.includes("localhost") &&
  !connectionString.includes("127.0.0.1")
);

const pool = new Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on("error", (err) => {
  console.error("[PostgreSQL Pool Error]", err.message);
});

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
