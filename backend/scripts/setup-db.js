const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

function requiredUrl() {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("your_password")) {
    throw new Error(
      "Set DATABASE_URL in .env first. Example:\nDATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/hostellers"
    );
  }
  return url;
}

function isRemoteUrl(databaseUrl) {
  return !databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1");
}

function adminConfig(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: "postgres",
    ssl: isRemoteUrl(databaseUrl) ? { rejectUnauthorized: false } : false
  };
}

function appConfig(databaseUrl) {
  const parsed = new URL(databaseUrl);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, "")) || "hostellers",
    ssl: isRemoteUrl(databaseUrl) ? { rejectUnauthorized: false } : false
  };
}

function quoteIdent(name) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`Unsafe database name: ${name}`);
  }
  return `"${name}"`;
}

async function createDatabase(databaseUrl) {
  if (isRemoteUrl(databaseUrl)) {
    console.log(`[Cloud Deployment] Remote PostgreSQL detected. Connecting directly to target database.`);
    return;
  }
  const app = appConfig(databaseUrl);
  try {
    const client = new Client(adminConfig(databaseUrl));
    await client.connect();
    const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [app.database]);
    if (!existing.rowCount) {
      await client.query(`CREATE DATABASE ${quoteIdent(app.database)}`);
      console.log(`Created database ${app.database}`);
    } else {
      console.log(`Database ${app.database} already exists`);
    }
    await client.end();
  } catch (err) {
    console.log(`Note: Proceeding directly with database "${app.database}" (${err.message})`);
  }
}

function roomsForHostel(hostel) {
  const roomCount = Math.max(1, Math.floor(hostel.capacity / hostel.seater));
  const perFloor = Math.max(1, Math.ceil(roomCount / hostel.floors));
  const rooms = [];
  let created = 0;
  for (let floor = 1; floor <= hostel.floors; floor += 1) {
    const floorRooms = floor === hostel.floors
      ? roomCount - created
      : Math.min(perFloor, roomCount - created);
    for (let index = 1; index <= floorRooms; index += 1) {
      const roomNumber = floor * 100 + index;
      rooms.push({
        room_id: `${hostel.block_id}-${roomNumber}`.slice(0, 20),
        room_number: roomNumber,
        floor_number: floor,
        block_id: hostel.block_id
      });
    }
    created += floorRooms;
  }
  return rooms;
}

async function seedRoomsAndAssignments(client) {
  const hostels = (await client.query("SELECT * FROM hostel ORDER BY block_id")).rows;
  for (const hostel of hostels) {
    const rooms = roomsForHostel(hostel);
    const floorCounts = {};
    for (const room of rooms) {
      floorCounts[room.floor_number] = (floorCounts[room.floor_number] || 0) + 1;
      await client.query(
        `INSERT INTO room (room_id, room_number, floor_number, block_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (room_id) DO NOTHING`,
        [room.room_id, room.room_number, room.floor_number, room.block_id]
      );
    }
    for (const [floorNumber, count] of Object.entries(floorCounts)) {
      await client.query(
        `INSERT INTO hostel_floor_rooms (block_id, floor_number, number_of_rooms)
         VALUES ($1, $2, $3)
         ON CONFLICT (block_id, floor_number) DO UPDATE SET number_of_rooms = EXCLUDED.number_of_rooms`,
        [hostel.block_id, Number(floorNumber), count]
      );
    }
  }

  const assignments = [
    ["EMP_001", "VAM_B_01"],
    ["EMP_001", "NAG_B_02"],
    ["EMP_002", "SAB_B_03"],
    ["EMP_002", "IND_B_03"],
    ["EMP_003", "KRI_G_01"]
  ];
  for (const [employeeId, blockId] of assignments) {
    await client.query(
      `INSERT INTO caretaker_hostel (employee_id, block_id)
       VALUES ($1, $2)
       ON CONFLICT (employee_id, block_id) DO NOTHING`,
      [employeeId, blockId]
    );
  }

  const studentRooms = [
    [424001, "SAB_B_03"],
    [524001, "IND_B_03"],
    [425005, "NAG_B_02"],
    [325003, "KRI_G_01"]
  ];
  for (const [rollNumber, blockId] of studentRooms) {
    const room = await client.query(
      `SELECT room_id FROM room WHERE block_id = $1 ORDER BY room_number LIMIT 1`,
      [blockId]
    );
    if (!room.rowCount) continue;
    await client.query(
      `INSERT INTO student_hostel (roll_number, room_id)
       VALUES ($1, $2)
       ON CONFLICT (roll_number, room_id) DO NOTHING`,
      [rollNumber, room.rows[0].room_id]
    );
  }
}

async function main() {
  const databaseUrl = requiredUrl();
  await createDatabase(databaseUrl);

  const client = new Client(appConfig(databaseUrl));
  await client.connect();
  const sql = fs.readFileSync(path.join(__dirname, "..", "database.sql"), "utf8");
  await client.query(sql);
  await seedRoomsAndAssignments(client);

  const counts = await client.query(`
    SELECT
      (SELECT count(*) FROM admin) AS admins,
      (SELECT count(*) FROM student) AS students,
      (SELECT count(*) FROM caretaker) AS caretakers,
      (SELECT count(*) FROM hostel) AS hostels,
      (SELECT count(*) FROM room) AS rooms
  `);
  console.log("Database ready:", counts.rows[0]);
  await client.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
