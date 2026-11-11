const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { query } = require("./db");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const sessions = new Map();

// Resolve frontend directory in enterprise multi-directory structure
const candidateFrontend = path.resolve(__dirname, "../frontend");
const FRONTEND_DIR = fs.existsSync(candidateFrontend) ? candidateFrontend : __dirname;

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(express.static(FRONTEND_DIR));

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.slice(0, 20);
}

function getNowFormatted() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
}

function todayParts() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${mins}:${secs}`,
    displayDate: `${day}/${month}/${year}`,
    displayTime: `${hours}:${mins}:${secs}`,
    displayDateTime: `${day}/${month}/${year} ${hours}:${mins}:${secs}`
  };
}

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
}

async function passwordsMatch(plain, stored) {
  if (!plain || !stored) return false;
  if (typeof stored === "string" && stored.startsWith("$2")) {
    const isMatch = await bcrypt.compare(plain, stored).catch(() => false);
    if (isMatch) return true;
  }
  return String(plain).trim() === String(stored).trim();
}

async function getStudentContext(rollNumber) {
  if (!rollNumber) return null;
  const rollStr = String(rollNumber);
  const rollNum = Number(rollNumber);
  let ctx = null;

  try {
    const result = await query(
      `SELECT s.roll_number, s.registered_number, s.name, s.year, s.phone_number, s.email, s.gender,
              sh.room_id, r.room_number, r.floor_number, r.block_id, h.name AS hostel_name, h.for_gender
       FROM student s
       LEFT JOIN student_hostel sh ON sh.roll_number = s.roll_number
       LEFT JOIN room r ON r.room_id = sh.room_id
       LEFT JOIN hostel h ON h.block_id = r.block_id
       WHERE s.roll_number = $1
       LIMIT 1`,
      [rollNum]
    );
    if (result.rows && result.rows.length > 0) {
      ctx = { ...result.rows[0] };
    }
  } catch (err) {
    console.warn("getStudentContext DB error:", err.message);
  }

  // Check verified allocation in memoryStore
  const verifiedAlloc = memoryStore.allocations.find(
    a => String(a.roll) === rollStr && (a.status === "Verified" || a.status === "Active")
  );

  // Fallback to in-memory/fallback student
  if (!ctx) {
    const fb = fallbackStudents.find(s => String(s.roll_number) === rollStr);
    if (fb) {
      ctx = { ...fb };
    }
  }

  // If ctx has no room_id, but verified in memoryStore or fallbackStudents:
  if (ctx && !ctx.room_id && verifiedAlloc) {
    const hLower = (verifiedAlloc.hostel || "").toLowerCase();
    const bId = hLower.startsWith("sab") ? "SAB_B_03" :
                (hLower.startsWith("ind") ? "IND_B_03" :
                (hLower.startsWith("nag") ? "NAG_B_02" :
                (hLower.startsWith("kri") ? "KRI_G_01" : "VAM_B_01")));
    const rNum = Number(verifiedAlloc.room) || 101;
    ctx.room_id = `${bId}-${rNum}`;
    ctx.room_number = rNum;
    ctx.hostel_name = verifiedAlloc.hostel;
    ctx.block_id = bId;
    ctx.floor_number = Math.floor(rNum / 100);

    // Sync to PostgreSQL student and student_hostel in the background
    (async () => {
      try {
        await query(
          `INSERT INTO student (roll_number, registered_number, name, year, phone_number, email, password, gender)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (roll_number) DO NOTHING`,
          [rollNum, Number(ctx.registered_number) || rollNum, ctx.name, ctx.year || 3, 9876543210, ctx.email || `${rollStr}@nitandhra.ac.in`, 'Student@001', ctx.gender || 'Male']
        );
        await query(
          `INSERT INTO room (room_id, block_id, room_number, floor_number)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (room_id) DO NOTHING`,
          [ctx.room_id, bId, rNum, ctx.floor_number]
        );
        await query(
          `INSERT INTO student_hostel (roll_number, room_id)
           VALUES ($1, $2)
           ON CONFLICT (roll_number, room_id) DO NOTHING`,
          [rollNum, ctx.room_id]
        );
      } catch (e) {
        // silent
      }
    })();
  } else if (!ctx.room_id) {
    const fb = fallbackStudents.find(s => String(s.roll_number) === rollStr);
    if (fb && fb.room_id) {
      const bId = fb.block_id || (fb.hostel_name?.toLowerCase().startsWith("sab") ? "SAB_B_03" : "IND_B_03");
      const rNum = Number(fb.room_number) || 101;
      ctx.room_id = `${bId}-${rNum}`;
      ctx.room_number = rNum;
      ctx.hostel_name = fb.hostel_name || "Sabari";
      ctx.block_id = bId;
      ctx.floor_number = fb.floor_number || 1;
    }
  }

  return ctx;
}

const deletedCaretakerIds = new Set();

const fallbackCaretakers = [
  { employee_id: 'EMP_001', name: 'CareTaker One', email: 'emp001@gmail.com', password: 'OC@001', phone_number: '9096735463', blocks: [{ block_id: 'SAB_B_03', name: 'Sabari' }] },
  { employee_id: 'EMP_002', name: 'Two Caretaker', email: 'emp002@gmail.com', password: 'TC@002', phone_number: '8897896709', blocks: [{ block_id: 'NAG_B_02', name: 'Nagavali' }] },
  { employee_id: 'EMP_003', name: 'Third Caretaker', email: 'emp003@gmail.com', password: 'TC@003', phone_number: '8790126379', blocks: [{ block_id: 'IND_B_03', name: 'Indravathi' }] }
];

const fallbackAdmins = [
  { key: 'Admin_001', password: 'Admin@001', name: 'Administrator' },
  { key: 'Admin_002', password: 'Admin@002', name: 'Administrator' }
];

const fallbackStudents = [
  {
    roll_number: 424154,
    registered_number: 924154,
    name: 'Santhosh',
    email: 'santhosh@student.nitandhra.ac.in',
    password: 'Sonthosh@123',
    year: 3,
    gender: 'Male',
    phone_number: '1234567890',
    room_number: '101',
    block_id: 'IND_B_03',
    hostel_name: 'Indravathi',
    room_id: 'IND_101',
    floor_number: 1
  },
  {
    roll_number: 424001,
    registered_number: 924001,
    name: 'First Person',
    email: 'firstperson@gmail.com',
    password: 'Student@001',
    year: 3,
    gender: 'Male',
    phone_number: '9182347654',
    room_number: '112',
    block_id: 'SAB_B_03',
    hostel_name: 'Sabari',
    room_id: 'SAB_112',
    floor_number: 1
  },
  {
    roll_number: 424151,
    registered_number: 924151,
    name: 'Sanjay Pal',
    email: 'sanjaypal@student.nitandhra.ac.in',
    password: 'Student@001',
    year: 3,
    gender: 'Male',
    phone_number: '9988776655',
    room_number: '112',
    block_id: 'SAB_B_03',
    hostel_name: 'Sabari',
    room_id: 'SAB_112',
    floor_number: 1
  },
  {
    roll_number: 424165,
    registered_number: 924165,
    name: 'Jyo',
    email: 'jyo@student.nitandhra.ac.in',
    password: 'Student@001',
    year: 3,
    gender: 'Male',
    phone_number: '9182736450',
    room_number: '243',
    block_id: 'IND_B_03',
    hostel_name: 'Indravathi',
    room_id: 'IND_243',
    floor_number: 2
  },
  {
    roll_number: 524001,
    registered_number: 924002,
    name: 'Second Person',
    email: 'secondperson@gmail.com',
    password: 'SP@001',
    year: 3,
    gender: 'Male',
    phone_number: '8900327640',
    room_number: 'G32',
    block_id: 'SAB_B_03',
    hostel_name: 'Sabari',
    room_id: 'SAB_G32',
    floor_number: 0
  },
  {
    roll_number: 525044,
    registered_number: 925044,
    name: 'Person 3',
    email: 'person3@student.nitandhra.ac.in',
    password: 'Student@001',
    year: 2,
    gender: 'Male',
    phone_number: '9988112233',
    room_number: '333',
    block_id: 'NAG_B_02',
    hostel_name: 'Nagavalli',
    room_id: 'NAG_333',
    floor_number: 3
  },
  {
    roll_number: 325003,
    registered_number: 925002,
    name: 'Third Person',
    email: '325003@student.nitandhra.ac.in',
    password: 'TP@003',
    year: 2,
    gender: 'Female',
    phone_number: '9988765342',
    room_number: null,
    block_id: 'KRI_G_01',
    hostel_name: 'Krishna',
    room_id: null,
    floor_number: 1
  },
  {
    roll_number: 425005,
    registered_number: 925004,
    name: 'Fourth Person',
    email: '425005@student.nitandhra.ac.in',
    password: 'FP@005',
    year: 2,
    gender: 'Male',
    phone_number: '7765983254',
    room_number: null,
    block_id: 'NAG_B_02',
    hostel_name: 'Nagavalli',
    room_id: null,
    floor_number: 1
  }
];

const memoryStore = {
  announcements: [
    { announcement_id: 'ANN_1', date: '2026-08-14', time: '09:00:00', announcement: 'Special Dinner\n\nPlease collect your special dinner tokens at your respected hostel blocks from the caretaker.', hostels: ['Sabari'] },
    { announcement_id: 'ANN_2', date: '2026-08-12', time: '14:30:00', announcement: 'Non Local Outing\n\nNo non local outing for students who hasn\'t applied to it.', hostels: ['Sabari'] },
    { announcement_id: 'ANN_3', date: '2026-08-10', time: '08:00:00', announcement: 'Power Shutdown\n\nDear Students, This is to inform you that there will be a power shut-down on 14 August 2026 from 9:00 AM to 5:00 PM', hostels: ['All Hostels'] }
  ],
  complaints: [
    { complaint_id: 'CMP_1', roll_number: 424001, room_id: 'SAB_G30', date: '2026-10-04', time: '10:00:00', complaint: 'No Cleaning\n\nIt\'s been 3 days since no cleaning has done to our rooms.', status: false, votes: 5, student_name: 'Student One', hostel_name: 'Sabari', room_number: 'G30' },
    { complaint_id: 'CMP_2', roll_number: 524001, room_id: 'SAB_G32', date: '2026-09-29', time: '11:30:00', complaint: 'Non Local Outing\n\nNo non local outing for students who hasn\'t applied to it.', status: false, votes: 0, student_name: 'Student Two', hostel_name: 'Sabari', room_number: 'G32' },
    { complaint_id: 'CMP_3', roll_number: 424001, room_id: 'SAB_G30', date: '2026-08-14', time: '09:00:00', complaint: 'Power Shutdown\n\nDear Students, This is to inform you that there will be a power shut-down on 14 August 2026 from 9:00 AM to 5:00 PM', status: true, votes: 2, student_name: 'Student One', hostel_name: 'Sabari', room_number: 'G30' }
  ],
  outings: [
    { outing_id: 'OUT_1', roll_number: 424001, from_date: '2026-09-12', to_date: '2026-09-14', purpose: 'Non local outing to go home for Vinayaka Chavithi', parent_ph_no: '9988776655', date: '2026-10-06', time: '15:34:00', status: null, student_name: 'Student One', hostel_name: 'Sabari', room_number: 'G30' },
    { outing_id: 'OUT_2', roll_number: 524001, from_date: '2026-09-12', to_date: '2026-09-20', purpose: 'Non local outing to go home for vacation.', parent_ph_no: '9988176918', date: '2026-10-06', time: '20:14:00', status: null, student_name: 'Student Two', hostel_name: 'Sabari', room_number: 'G32' }
  ],
  maintenance: [
    { maintenance_id: 'MNT_1', date: '2026-09-08', time: '09:59:00', room_number: 'S12', cleaning_status: true, moping_status: false, remarks: 'None' },
    { maintenance_id: 'MNT_2', date: '2026-09-08', time: '09:00:00', room_number: 'G30', cleaning_status: true, moping_status: false, remarks: 'None' },
    { maintenance_id: 'MNT_3', date: '2026-09-08', time: '14:15:00', room_number: 'F16', cleaning_status: true, moping_status: true, remarks: 'None' },
    { maintenance_id: 'MNT_4', date: '2026-09-08', time: '12:20:00', room_number: 'G32', cleaning_status: true, moping_status: false, remarks: 'None' },
    { maintenance_id: 'MNT_5', date: '2026-09-06', time: '09:59:00', room_number: 'S12', cleaning_status: true, moping_status: false, remarks: 'None' },
    { maintenance_id: 'MNT_6', date: '2026-09-06', time: '09:00:00', room_number: 'G30', cleaning_status: true, moping_status: false, remarks: 'None' }
  ],
  allocations: [
    {
      id: 'ALC_1',
      dateTime: '26.04.26/14:20',
      roll: '424151',
      name: 'Sanjay Pal',
      year: '3',
      hostel: 'Sabari',
      room: '112',
      receiptPdf: null,
      receiptName: 'Fee_Receipt_424151.pdf',
      receiptRef: 'REC-DUK829104',
      status: 'Review'
    },
    {
      id: 'ALC_2',
      dateTime: '28.04.26/11:40',
      roll: '424165',
      name: 'Jyo',
      year: '3',
      hostel: 'Indravathi',
      room: '243',
      receiptPdf: null,
      receiptName: 'Fee_Receipt_424165.pdf',
      receiptRef: 'REC-DUK918234',
      status: 'Verified'
    },
    {
      id: 'ALC_3',
      dateTime: '22.04.26/14:40',
      roll: '525044',
      name: 'Person 3',
      year: '2',
      hostel: 'Nagavalli',
      room: '333',
      receiptPdf: null,
      receiptName: 'Fee_Receipt_525044.pdf',
      receiptRef: 'REC-DUK774192',
      status: 'Declined'
    }
  ],
  evacuations: [
    {
      id: 'EVAC_1',
      dateTime: '26.04.26/14:20',
      roll: '424151',
      name: 'Sanjay Pal',
      year: '3',
      hostel: 'Sabari',
      room: '112',
      leaveDate: '28.04.26',
      status: 'Review'
    },
    {
      id: 'EVAC_2',
      dateTime: '28.04.26/11:40',
      roll: '424165',
      name: 'Jyo',
      year: '3',
      hostel: 'Indravathi',
      room: '243',
      leaveDate: '29.04.26',
      status: 'Verified'
    },
    {
      id: 'EVAC_3',
      dateTime: '22.04.26/14:40',
      roll: '525044',
      name: 'Person 3',
      year: '2',
      hostel: 'Nagavalli',
      room: '333',
      leaveDate: '30.04.26',
      status: 'Declined'
    }
  ],
  notifications: [
    {
      id: 'NOTIF_1',
      roll: '424151',
      title: 'Room Allocation Under Review',
      message: 'Your hostel room allocation request for Sabari (Room 112) with PDF fee receipt is awaiting Admin verification.',
      dateTime: '26.04.26 14:20',
      read: false,
      type: 'allocation'
    },
    {
      id: 'NOTIF_2',
      roll: '424165',
      title: 'Hostel Room Allocation Verified! 🎉',
      message: 'Your hostel room allocation in Indravathi (Room 243) has been officially verified by Admin.',
      dateTime: '28.04.26 11:40',
      read: true,
      type: 'allocation'
    }
  ],
  windows: {
    allocation: {
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      active: true
    },
    evacuation: {
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      active: true
    }
  },
  contactUs: {
    chiefWarden: {
      name: 'Dr. G. Rajesh',
      role: 'Chief Warden & Associate Professor',
      phone: '+91 8818 252 001',
      email: 'chiefwarden@nitandhra.ac.in',
      office: 'Administrative Building, Ground Floor, Room 104',
      institute: 'National Institute of Technology Andhra Pradesh'
    },
    hostelOffice: {
      name: 'Central Hostel Office Helpdesk',
      phone: '+91 8818 252 002',
      email: 'hosteloffice@nitandhra.ac.in',
      location: 'Central Hostel Office Block (Near Mess Complex)',
      hours: 'Monday to Saturday: 9:00 AM - 5:30 PM'
    },
    emergency: {
      ambulance: '+91 98888 11111 (24x7 Ambulance & Health Center)',
      security: 'Ext 100 / +91 98765 00000 (Campus Security Gate)',
      sabari: '+91 9988776601',
      indravathi: '+91 9988776602',
      nagavalli: '+91 9988776603',
      krishna: '+91 9988776604',
      vamsadhara: '+91 9988776605'
    }
  }
};

function isWindowOpen(win) {
  if (!win || win.active === false) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (win.startDate) {
    const s = new Date(win.startDate);
    s.setHours(0, 0, 0, 0);
    if (now < s) return false;
  }
  if (win.endDate) {
    const e = new Date(win.endDate);
    e.setHours(23, 59, 59, 999);
    if (now > e) return false;
  }
  return true;
}

async function getCaretakerAssignedBlocks(employeeId, session = null) {
  const blockIds = new Set();
  const hostelNames = new Set();
  const empIdClean = String(employeeId || "").trim();

  // 1. From database (caretaker_hostel + hostel)
  try {
    const res = await query(
      `SELECT ch.block_id, LOWER(h.name) AS hostel_name
       FROM caretaker_hostel ch
       LEFT JOIN hostel h ON h.block_id = ch.block_id
       WHERE LOWER(ch.employee_id) = LOWER($1)`,
      [empIdClean]
    );
    for (const row of res.rows) {
      if (row.block_id) blockIds.add(String(row.block_id).toUpperCase());
      if (row.hostel_name) hostelNames.add(String(row.hostel_name).toLowerCase());
    }
  } catch (e) {
    // db fallback
  }

  // 2. From active session
  if (session && Array.isArray(session.blocks)) {
    for (const b of session.blocks) {
      if (b.block_id) blockIds.add(String(b.block_id).toUpperCase());
      if (b.name) hostelNames.add(String(b.name).toLowerCase());
    }
  }

  // 3. From fallbackCaretakers
  const fb = fallbackCaretakers.find(c => c.employee_id.toLowerCase() === empIdClean.toLowerCase());
  if (fb && Array.isArray(fb.blocks)) {
    for (const b of fb.blocks) {
      if (b.block_id) blockIds.add(String(b.block_id).toUpperCase());
      if (b.name) hostelNames.add(String(b.name).toLowerCase());
    }
  }

  return {
    blockIds: Array.from(blockIds),
    hostelNames: Array.from(hostelNames)
  };
}

function outingMatchesCaretaker(o, assigned) {
  if (!assigned || (!assigned.blockIds.length && !assigned.hostelNames.length)) {
    return false;
  }
  // Check outing block_id
  if (o.block_id && assigned.blockIds.some(bid => String(o.block_id).toUpperCase() === bid.toUpperCase())) {
    return true;
  }
  // Check outing hostel_name
  if (o.hostel_name && assigned.hostelNames.some(hn => o.hostel_name.toLowerCase().includes(hn) || hn.includes(o.hostel_name.toLowerCase()))) {
    return true;
  }
  // Check student roll number against fallbackStudents
  const stRoll = String(o.roll_number || '');
  const fbStudent = fallbackStudents.find(s => String(s.roll_number) === stRoll);
  if (fbStudent) {
    if (fbStudent.block_id && assigned.blockIds.some(bid => String(fbStudent.block_id).toUpperCase() === bid.toUpperCase())) {
      return true;
    }
    if (fbStudent.hostel_name && assigned.hostelNames.some(hn => fbStudent.hostel_name.toLowerCase().includes(hn) || hn.includes(fbStudent.hostel_name.toLowerCase()))) {
      return true;
    }
  }
  // Check room allocation
  const alloc = (memoryStore.allocations || []).find(a => String(a.roll) === stRoll);
  if (alloc && alloc.hostel) {
    if (assigned.hostelNames.some(hn => alloc.hostel.toLowerCase().includes(hn) || hn.includes(alloc.hostel.toLowerCase()))) {
      return true;
    }
  }
  return false;
}

function publicUser(role, row) {
  if (role === "admin") {
    return { role, userId: row.key, name: "Administrator", key: row.key };
  }
  if (role === "caretaker") {
    return {
      role,
      userId: row.employee_id,
      name: row.name,
      employee_id: row.employee_id,
      email: row.email,
      phone: row.phone_number
    };
  }
  return {
    role,
    userId: String(row.roll_number),
    name: row.name,
    roll: String(row.roll_number),
    registration: String(row.registered_number),
    email: row.email,
    phone: row.phone_number,
    year: row.year,
    gender: row.gender,
    room: row.room_number ? String(row.room_number) : null,
    block: row.hostel_name || null,
    block_id: row.block_id || null,
    room_id: row.room_id || null,
    floor: row.floor_number || null
  };
}

const TOKEN_SECRET = process.env.SESSION_SECRET || "hostellers-secure-session-secret-2026";

function signToken(data) {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expectedSignature = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("base64url");
  if (signature !== expectedSignature) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

function requireAuth(roles) {
  return async (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    let session = sessions.get(token);

    // If session is not in cache (e.g. server restarted), restore from verified token
    if (!session && token) {
      const verified = verifyToken(token);
      if (verified) {
        try {
          if (verified.role === "student") {
            const student = await getStudentContext(Number(verified.userId));
            if (student) session = { ...publicUser("student", student), token };
          } else if (verified.role === "caretaker") {
            const cRes = await query("SELECT employee_id, name, email, phone_number FROM caretaker WHERE employee_id = $1", [verified.userId]);
            if (cRes.rowCount) session = { ...publicUser("caretaker", cRes.rows[0]), token };
          } else if (verified.role === "admin") {
            const aRes = await query("SELECT key FROM admin WHERE key = $1", [verified.userId]);
            if (aRes.rowCount) session = { ...publicUser("admin", aRes.rows[0]), token };
          }
          if (session) {
            sessions.set(token, session);
          }
        } catch (e) {
          console.warn("Failed to restore session from token:", e.message);
        }
      }
    }

    if (!session) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    if (roles && !roles.includes(session.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    req.session = session;
    next();
  };
}

app.get("/api/health", async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({ success: true, database: "connected" });
  } catch (error) {
    res.status(500).json({ success: false, database: "not connected", message: error.message });
  }
});

app.post("/api/register", async (req, res) => {
  const { name, email, phone, roll, registration, password, year, gender } = req.body;
  if (!name || !email || !phone || !roll || !registration || !password || !year || !gender) {
    return res.status(400).json({ success: false, message: "All registration fields are required" });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address" });
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ success: false, message: passwordError });
  }

  const rollNumber = Number(roll);
  const registeredNumber = Number(registration);
  const studentYear = Number(year);
  const phoneNumber = Number(digits(phone));
  if (!Number.isInteger(rollNumber) || !Number.isInteger(registeredNumber) || !phoneNumber) {
    return res.status(400).json({ success: false, message: "Roll, registration, and phone must be numbers" });
  }
  if (![1, 2, 3, 4].includes(studentYear)) {
    return res.status(400).json({ success: false, message: "Year must be 1, 2, 3, or 4" });
  }
  if (!["Male", "Female"].includes(gender)) {
    return res.status(400).json({ success: false, message: "Gender must be Male or Female" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await query(
      `INSERT INTO student
       (roll_number, registered_number, name, year, phone_number, email, password, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [rollNumber, registeredNumber, name.trim(), studentYear, phoneNumber, email.trim(), passwordHash, gender]
    );
    fallbackStudents.unshift({
      roll_number: rollNumber,
      registered_number: registeredNumber,
      name: name.trim(),
      year: studentYear,
      phone_number: String(phoneNumber),
      email: email.trim(),
      password: password,
      gender,
      room_number: null,
      block_id: null,
      hostel_name: null,
      room_id: null
    });
    res.status(201).json({ success: true, message: "Registration successful" });
  } catch (error) {
    const isDuplicate = error.code === "23505";
    if (isDuplicate) {
      return res.status(409).json({ success: false, message: "Student already exists" });
    }
    // Fallback in-memory registration for offline mode
    const existing = fallbackStudents.find(s => s.roll_number === rollNumber || s.email === email.trim());
    if (existing) {
      return res.status(409).json({ success: false, message: "Student already exists" });
    }
    fallbackStudents.unshift({
      roll_number: rollNumber,
      registered_number: registeredNumber,
      name: name.trim(),
      year: studentYear,
      phone_number: String(phoneNumber),
      email: email.trim(),
      password: password,
      gender,
      room_number: null,
      block_id: null,
      hostel_name: null,
      room_id: null
    });
    res.status(201).json({ success: true, message: "Registration successful" });
  }
});

app.post("/api/login", async (req, res) => {
  const { id, password, role } = req.body;
  if (!id || !password || !role) {
    return res.status(400).json({ success: false, message: "id, password, and role are required" });
  }

  const cleanId = String(id).trim();
  const requestedRole = String(role).trim().toLowerCase();
  if (!["student", "caretaker", "admin"].includes(requestedRole)) {
    return res.status(400).json({ success: false, message: "Invalid role specified" });
  }

  let userRow = null;
  let fallbackUser = null;

  // 1. Try DB first strictly for requested role
  try {
    if (requestedRole === "admin") {
      const result = await query("SELECT key, password FROM admin WHERE key = $1", [cleanId]);
      userRow = result.rows[0];
    } else if (requestedRole === "caretaker") {
      const result = await query(
        `SELECT employee_id, name, phone_number, email, password
         FROM caretaker
         WHERE employee_id = $1 OR LOWER(email) = LOWER($1)`,
        [cleanId]
      );
      userRow = result.rows[0];
    } else if (requestedRole === "student") {
      const result = await query(
        `SELECT roll_number, password
         FROM student
         WHERE roll_number::text = $1 OR LOWER(email) = LOWER($1) OR registered_number::text = $1`,
        [cleanId]
      );
      if (result.rows[0]) {
        const studentCtx = await getStudentContext(result.rows[0].roll_number);
        userRow = studentCtx || result.rows[0];
        userRow.password = result.rows[0].password;
      }
    }
  } catch (dbErr) {
    console.warn("DB login query error:", dbErr.message);
  }

  // 2. Check fallback strictly for the requested role (never cross-role)
  if (!userRow) {
    const idLower = cleanId.toLowerCase();
    if (requestedRole === "caretaker") {
      fallbackUser = fallbackCaretakers.find(c => c.employee_id.toLowerCase() === idLower || c.email.toLowerCase() === idLower);
    } else if (requestedRole === "admin") {
      fallbackUser = fallbackAdmins.find(a => a.key.toLowerCase() === idLower);
    } else if (requestedRole === "student") {
      fallbackUser = fallbackStudents.find(s =>
        String(s.roll_number) === cleanId ||
        String(s.registered_number) === cleanId ||
        s.email.toLowerCase() === idLower
      );
    }
  }

  const target = userRow || fallbackUser;
  if (!target) {
    const roleLabels = { student: "Student", caretaker: "Caretaker", admin: "Admin" };
    return res.status(401).json({
      success: false,
      message: `Invalid credentials. Please verify your ${roleLabels[requestedRole] || "user"} ID.`
    });
  }

  const ok = await passwordsMatch(password, target.password);
  if (!ok) {
    return res.status(401).json({ success: false, message: "Invalid password." });
  }

  const user = publicUser(requestedRole, target);
  const token = signToken({
    userId: user.userId,
    role: user.role,
    name: user.name,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000
  });

  let caretakerBlocks = target.blocks || [];
  if (requestedRole === "caretaker" && (!caretakerBlocks || !caretakerBlocks.length)) {
    try {
      const ctHostels = await query(
        `SELECT ch.block_id, h.name
         FROM caretaker_hostel ch
         JOIN hostel h ON h.block_id = ch.block_id
         WHERE LOWER(ch.employee_id) = LOWER($1)`,
        [user.userId]
      );
      if (ctHostels.rows && ctHostels.rows.length > 0) {
        caretakerBlocks = ctHostels.rows;
      }
    } catch (e) {}
  }
  if (requestedRole === "caretaker" && (!caretakerBlocks || !caretakerBlocks.length)) {
    const fb = fallbackCaretakers.find(c => c.employee_id.toLowerCase() === String(user.userId).toLowerCase());
    if (fb && fb.blocks) caretakerBlocks = fb.blocks;
  }
  if (requestedRole === "caretaker" && (!caretakerBlocks || !caretakerBlocks.length)) {
    caretakerBlocks = [{ block_id: "SAB_B_03", name: "Sabari" }];
  }

  const sessionObj = {
    ...user,
    token,
    loginTime: Date.now(),
    ...(requestedRole === "caretaker" ? { blocks: caretakerBlocks } : {})
  };
  sessions.set(token, sessionObj);

  return res.json({ success: true, token, user: sessionObj });
});

app.get("/api/me", requireAuth(), async (req, res) => {
  try {
    if (req.session.role === "student") {
      const student = await getStudentContext(Number(req.session.userId));
      return res.json({ success: true, user: publicUser("student", student) });
    }
    if (req.session.role === "caretaker") {
      const blocks = await query(
        `SELECT h.block_id, h.name
         FROM caretaker_hostel ch
         JOIN hostel h ON h.block_id = ch.block_id
         WHERE ch.employee_id = $1`,
        [req.session.userId]
      );
      return res.json({ success: true, user: { ...req.session, blocks: blocks.rows } });
    }
    res.json({ success: true, user: req.session });
  } catch (error) {
    const user = { ...req.session };
    if (user.role === "caretaker" && (!user.blocks || !user.blocks.length)) {
      user.blocks = [{ block_id: "SAB_B_03", name: "Sabari" }];
    }
    res.json({ success: true, user });
  }
});

app.get("/api/hostels", requireAuth(), async (req, res) => {
  try {
    const result = await query(
      `SELECT h.*, COALESCE(json_agg(hy.student_year) FILTER (WHERE hy.student_year IS NOT NULL), '[]') AS years
       FROM hostel h
       LEFT JOIN hostel_year hy ON hy.block_id = h.block_id
       GROUP BY h.block_id
       ORDER BY h.name`
    );
    res.json({ success: true, hostels: result.rows });
  } catch (error) {
    res.json({
      success: true,
      hostels: [
        { block_id: "SAB_B_03", name: "Sabari", floors: 3, seater: 2, capacity: 150, for_gender: "Male", years: [3] },
        { block_id: "NAG_B_02", name: "Nagavali", floors: 3, seater: 2, capacity: 150, for_gender: "Male", years: [2] },
        { block_id: "IND_B_03", name: "Indravathi", floors: 3, seater: 2, capacity: 150, for_gender: "Male", years: [3] },
        { block_id: "VAM_B_01", name: "Vamsadhara", floors: 3, seater: 2, capacity: 150, for_gender: "Male", years: [1] },
        { block_id: "KRI_G_01", name: "Krishna", floors: 3, seater: 2, capacity: 150, for_gender: "Female", years: [1, 2] }
      ]
    });
  }
});

// Synchronize hostel rooms according to user specifications:
// - Floors from Ground Floor (0) to (floors - 1)
// - Total rooms = Math.floor(capacity / seater)
// - Rooms per floor = Math.floor(totalRooms / floors)
// - Remainder rooms go to Ground Floor (Floor 0)
async function syncHostelRooms(blockId, floors, seater, capacity) {
  const fCount = Math.max(1, Number(floors) || 3);
  const sCount = Math.max(1, Number(seater) || 2);
  const cap = Math.max(1, Number(capacity) || 150);

  const totalRooms = Math.floor(cap / sCount);
  const roomsPerFloor = Math.floor(totalRooms / fCount);
  const remainder = totalRooms % fCount;

  try {
    await query("DELETE FROM hostel_floor_rooms WHERE block_id = $1 AND floor_number >= $2", [blockId, fCount]);
  } catch (e) {}

  for (let f = 0; f < fCount; f++) {
    const floorRoomCount = (f === 0) ? (roomsPerFloor + remainder) : roomsPerFloor;
    try {
      await query(
        `INSERT INTO hostel_floor_rooms (block_id, floor_number, number_of_rooms)
         VALUES ($1, $2, $3)
         ON CONFLICT (block_id, floor_number) DO UPDATE SET number_of_rooms = EXCLUDED.number_of_rooms`,
        [blockId, f, floorRoomCount]
      );

      for (let r = 1; r <= floorRoomCount; r++) {
        const roomNum = (f === 0) ? r : (f * 100 + r);
        const roomId = `${blockId}-${roomNum}`;
        await query(
          `INSERT INTO room (room_id, block_id, room_number, floor_number)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (room_id) DO UPDATE SET
             floor_number = EXCLUDED.floor_number,
             room_number = EXCLUDED.room_number`,
          [roomId, blockId, roomNum, f]
        );
      }
    } catch (e) {
      console.warn("syncHostelRooms error on floor " + f + ":", e.message);
    }
  }
}

// Admin Create Hostel Block
app.post("/api/hostels", requireAuth(["admin"]), async (req, res) => {
  const { name, for_gender, floors, seater, capacity, block_id, years } = req.body;
  if (!name || !for_gender || !floors || !capacity) {
    return res.status(400).json({ success: false, message: "Hostel Name, Gender, Floors, and Capacity are required" });
  }
  const cleanName = String(name).trim();
  const genderVal = for_gender.toLowerCase().startsWith('f') ? 'Female' : 'Male';
  const bId = block_id ? String(block_id).trim().toUpperCase() : `${cleanName.slice(0, 3).toUpperCase()}_${genderVal === 'Female' ? 'G' : 'B'}_0${Math.floor(1 + Math.random() * 9)}`;
  const fCount = Number(floors) || 3;
  const sCount = Number(seater) || 2;
  const cap = Number(capacity) || 150;

  // Process eligibility years (array of numbers, e.g. [1, 2, 3])
  let yearsArr = [];
  if (Array.isArray(years)) {
    yearsArr = years.map(Number).filter(n => !isNaN(n) && n > 0);
  } else if (typeof years === 'string' && years.trim()) {
    yearsArr = years.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
  } else if (typeof years === 'number') {
    yearsArr = [years];
  }
  if (!yearsArr.length) {
    yearsArr = [1, 2, 3, 4]; // default all years if none specified
  }

  try {
    await query(
      `INSERT INTO hostel (block_id, name, for_gender, floors, seater, capacity)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (block_id) DO UPDATE SET
         name = EXCLUDED.name,
         for_gender = EXCLUDED.for_gender,
         floors = EXCLUDED.floors,
         seater = EXCLUDED.seater,
         capacity = EXCLUDED.capacity`,
      [bId, cleanName, genderVal, fCount, sCount, cap]
    );

    // Save eligibility years in hostel_year table
    await query("DELETE FROM hostel_year WHERE block_id = $1", [bId]);
    for (const yr of yearsArr) {
      await query("INSERT INTO hostel_year (block_id, student_year) VALUES ($1, $2) ON CONFLICT DO NOTHING", [bId, yr]);
    }

    // Auto-generate rooms uniformly divided across floors with remainder on ground floor
    await syncHostelRooms(bId, fCount, sCount, cap);
  } catch (e) {
    console.warn("DB insert hostel error:", e.message);
  }

  const totalRooms = Math.floor(cap / sCount);
  res.status(201).json({
    success: true,
    message: `Hostel block "${cleanName}" added successfully with ${totalRooms} rooms across ${fCount} floors`,
    hostel: { block_id: bId, name: cleanName, for_gender: genderVal, floors: fCount, seater: sCount, capacity: cap, years: yearsArr }
  });
});

// Admin Edit Hostel Block
app.put("/api/hostels/:id", requireAuth(["admin"]), async (req, res) => {
  const blockId = String(req.params.id);
  const { name, for_gender, floors, seater, capacity, years } = req.body;
  try {
    await query(
      `UPDATE hostel
       SET name = COALESCE($1, name),
           for_gender = COALESCE($2, for_gender),
           floors = COALESCE($3, floors),
           seater = COALESCE($4, seater),
           capacity = COALESCE($5, capacity)
       WHERE block_id = $6`,
      [name ? String(name).trim() : null, for_gender || null, floors ? Number(floors) : null, seater ? Number(seater) : null, capacity ? Number(capacity) : null, blockId]
    );

    if (years !== undefined) {
      let yearsArr = [];
      if (Array.isArray(years)) {
        yearsArr = years.map(Number).filter(n => !isNaN(n) && n > 0);
      } else if (typeof years === 'string' && years.trim()) {
        yearsArr = years.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
      } else if (typeof years === 'number') {
        yearsArr = [years];
      }
      await query("DELETE FROM hostel_year WHERE block_id = $1", [blockId]);
      for (const yr of yearsArr) {
        await query("INSERT INTO hostel_year (block_id, student_year) VALUES ($1, $2) ON CONFLICT DO NOTHING", [blockId, yr]);
      }
    }

    // Update rooms for this block if dimensions were updated
    const updatedH = (await query("SELECT floors, seater, capacity FROM hostel WHERE block_id = $1", [blockId])).rows[0];
    if (updatedH) {
      await syncHostelRooms(blockId, updatedH.floors, updatedH.seater, updatedH.capacity);
    }
  } catch (e) {
    console.warn("DB update hostel error:", e.message);
  }
  res.json({ success: true, message: `Hostel block ${blockId} updated successfully` });
});

// Admin Remove Hostel Block
app.delete("/api/hostels/:id", requireAuth(["admin"]), async (req, res) => {
  const blockId = String(req.params.id);
  try {
    const countRes = await query(
      `SELECT count(*)::int as count FROM student_hostel sh
       JOIN room r ON r.room_id = sh.room_id
       WHERE r.block_id = $1`,
      [blockId]
    );
    if (countRes.rows[0]?.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove hostel block "${blockId}" because ${countRes.rows[0].count} students are currently allocated rooms in it. Please evacuate or reassign them first.`
      });
    }

    await query("DELETE FROM hostel_floor_rooms WHERE block_id = $1", [blockId]);
    await query("DELETE FROM hostel_year WHERE block_id = $1", [blockId]);
    await query("DELETE FROM hostel_announcements WHERE block_id = $1", [blockId]);
    await query("DELETE FROM hostel_complaints WHERE block_id = $1", [blockId]);
    await query("DELETE FROM hostel_maintenance WHERE block_id = $1", [blockId]);
    await query("DELETE FROM hostel_outing WHERE block_id = $1", [blockId]);
    await query("DELETE FROM caretaker_hostel WHERE block_id = $1", [blockId]);
    await query("DELETE FROM room WHERE block_id = $1", [blockId]);
    await query("DELETE FROM hostel WHERE block_id = $1", [blockId]);
  } catch (e) {
    console.warn("DB delete hostel error:", e.message);
  }
  res.json({ success: true, message: `Hostel block ${blockId} removed successfully` });
});

app.get("/api/announcements", requireAuth(), async (req, res) => {
  try {
    const result = await query(
      `SELECT a.announcement_id, a.date, a.time, a.announcement,
              COALESCE(json_agg(h.name) FILTER (WHERE h.name IS NOT NULL), '[]') AS hostels
       FROM announcements a
       LEFT JOIN hostel_announcements ha ON ha.announcement_id = a.announcement_id
       LEFT JOIN hostel h ON h.block_id = ha.block_id
       GROUP BY a.announcement_id
       ORDER BY a.date DESC, a.time DESC`
    );
    res.json({ success: true, announcements: result.rows });
  } catch (error) {
    res.json({ success: true, announcements: memoryStore.announcements });
  }
});

app.post("/api/announcements", requireAuth(["admin", "caretaker"]), async (req, res) => {
  const text = String(req.body.announcement || "").trim();
  const blockIds = Array.isArray(req.body.block_ids) ? req.body.block_ids : [];
  if (!text) {
    return res.status(400).json({ success: false, message: "Announcement text is required" });
  }
  const stamp = todayParts();
  const announcementId = makeId("ANN");
  try {
    await query(
      `INSERT INTO announcements (announcement_id, date, time, announcement)
       VALUES ($1, $2, $3, $4)`,
      [announcementId, stamp.date, stamp.time, text]
    );
    for (const blockId of blockIds) {
      await query(
        `INSERT INTO hostel_announcements (block_id, announcement_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [blockId, announcementId]
      );
    }
    res.status(201).json({ success: true, announcement_id: announcementId });
  } catch (error) {
    memoryStore.announcements.unshift({
      announcement_id: announcementId,
      date: stamp.date,
      time: stamp.time,
      announcement: text,
      hostels: ["Sabari"]
    });
    res.status(201).json({ success: true, announcement_id: announcementId });
  }
});

app.delete("/api/announcements/:id", requireAuth(["admin", "caretaker"]), async (req, res) => {
  const annId = String(req.params.id);
  try {
    await query("DELETE FROM hostel_announcements WHERE announcement_id = $1", [annId]);
    await query("DELETE FROM announcements WHERE announcement_id = $1", [annId]);
    memoryStore.announcements = memoryStore.announcements.filter(a => a.announcement_id !== annId);
    return res.json({ success: true, message: "Announcement deleted successfully" });
  } catch (error) {
    memoryStore.announcements = memoryStore.announcements.filter(a => a.announcement_id !== annId);
    return res.json({ success: true, message: "Announcement deleted successfully" });
  }
});

async function cleanupResolvedComplaints() {
  try {
    await query("ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE");
    const res = await query(
      `SELECT complaint_id FROM complaints
       WHERE status = true
         AND (
           (resolved_at IS NOT NULL AND resolved_at < NOW() - INTERVAL '3 days')
           OR (resolved_at IS NULL AND date < CURRENT_DATE - INTERVAL '3 days')
         )`
    );
    const toDeleteIds = res.rows.map(r => r.complaint_id);
    if (toDeleteIds.length > 0) {
      await query("DELETE FROM complaint_votes WHERE complaint_id = ANY($1)", [toDeleteIds]);
      await query("DELETE FROM hostel_complaints WHERE complaint_id = ANY($1)", [toDeleteIds]);
      await query("DELETE FROM complaints WHERE complaint_id = ANY($1)", [toDeleteIds]);
    }
  } catch (e) {
    console.warn("cleanupResolvedComplaints DB error:", e.message);
  }

  // Also clean up in memoryStore
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  memoryStore.complaints = memoryStore.complaints.filter(c => {
    if (!c.status) return true;
    if (c.resolved_at) {
      return (now - new Date(c.resolved_at).getTime()) < threeDaysMs;
    }
    if (c.date) {
      return (now - new Date(c.date).getTime()) < threeDaysMs;
    }
    return false;
  });
}

app.get("/api/complaints", requireAuth(), async (req, res) => {
  try {
    await cleanupResolvedComplaints();
    const currentUserId = String(req.session.userId);
    const mine = req.query.mine === "true";
    const params = [currentUserId];
    let where = "";
    if (req.session.role === "student" && mine) {
      params.push(Number(req.session.userId));
      where = `WHERE c.roll_number = $${params.length}`;
    } else if (req.session.role === "caretaker") {
      params.push(req.session.userId);
      where = `WHERE (
        r.block_id IN (SELECT block_id FROM caretaker_hostel WHERE employee_id = $${params.length})
        OR c.complaint_id IN (SELECT complaint_id FROM hostel_complaints WHERE block_id IN (SELECT block_id FROM caretaker_hostel WHERE employee_id = $${params.length}))
        OR NOT EXISTS (SELECT 1 FROM caretaker_hostel WHERE employee_id = $${params.length})
      )`;
    }
    const result = await query(
      `SELECT c.complaint_id, c.roll_number, c.room_id,
              to_char(c.date, 'YYYY-MM-DD') AS date,
              c.time, c.complaint, c.status, c.resolved_at,
              COALESCE(c.votes, 0) AS votes,
              EXISTS (
                SELECT 1 FROM complaint_votes cv
                WHERE cv.complaint_id = c.complaint_id AND cv.user_id = $1
              ) AS has_voted,
              s.name AS student_name, r.room_number, r.block_id, h.name AS hostel_name
       FROM complaints c
       LEFT JOIN student s ON s.roll_number = c.roll_number
       LEFT JOIN room r ON r.room_id = c.room_id
       LEFT JOIN hostel h ON h.block_id = r.block_id
       ${where}
       ORDER BY c.date DESC, c.time DESC`,
      params
    );
    if (result.rows && result.rows.length > 0) {
      return res.json({ success: true, complaints: result.rows });
    }
    if (req.session.role === "student" && mine) {
      const studentComps = memoryStore.complaints.filter(c => String(c.roll_number) === String(req.session.userId));
      return res.json({ success: true, complaints: studentComps });
    }
    res.json({ success: true, complaints: memoryStore.complaints });
  } catch (error) {
    if (req.session.role === "student" && req.query.mine === "true") {
      const studentComps = memoryStore.complaints.filter(c => String(c.roll_number) === String(req.session.userId));
      return res.json({ success: true, complaints: studentComps });
    }
    res.json({ success: true, complaints: memoryStore.complaints });
  }
});

const handleComplaintStatusUpdate = async (req, res) => {
  const statusVal = Boolean(req.body.status);
  const idStr = String(req.params.id);
  const cleanId = idStr.replace(/^CMP_/, "");
  const resolvedAtVal = statusVal ? new Date().toISOString() : null;

  try {
    await query(
      `UPDATE complaints
       SET status = $1, resolved_at = $2
       WHERE complaint_id = $3 OR complaint_id = $4 OR complaint_id = $5`,
      [statusVal, resolvedAtVal, idStr, `CMP_${idStr}`, cleanId]
    );
  } catch (error) {
    // Offline database fallback
  }
  const c = memoryStore.complaints.find(item =>
    item.complaint_id === idStr ||
    item.complaint_id === `CMP_${idStr}` ||
    item.complaint_id === cleanId ||
    item.id === idStr ||
    item.id === cleanId ||
    String(item.complaint_id).endsWith(cleanId)
  );
  if (c) {
    c.status = statusVal;
    c.resolved_at = resolvedAtVal;
  }
  res.json({ success: true, status: statusVal, complaint_id: idStr, message: statusVal ? "Marked complaint as Done" : "Marked complaint as In Progress" });
};

app.patch("/api/complaints/:id", requireAuth(["caretaker", "admin"]), handleComplaintStatusUpdate);
app.post("/api/complaints/:id/status", requireAuth(["caretaker", "admin"]), handleComplaintStatusUpdate);

app.get("/api/maintenance", requireAuth(), async (req, res) => {
  try {
    const params = [];
    let where = "";
    if (req.session.role === "caretaker") {
      params.push(req.session.userId);
      where = `WHERE (
        r.block_id IN (SELECT block_id FROM caretaker_hostel WHERE employee_id = $1)
        OR NOT EXISTS (SELECT 1 FROM caretaker_hostel WHERE employee_id = $1)
      )`;
    } else if (req.session.role === "student") {
      params.push(Number(req.session.userId));
      where = "WHERE m.roll_number = $1";
    }
    const result = await query(
      `SELECT m.maintenance_id, m.roll_number, m.room_id, m.cleaning_status, m.moping_status,
              m.remarks, to_char(m.date, 'YYYY-MM-DD') AS date, m.time, r.room_number, r.block_id, h.name AS hostel_name
       FROM maintenance m
       LEFT JOIN room r ON r.room_id = m.room_id
       LEFT JOIN hostel h ON h.block_id = r.block_id
       ${where}
       ORDER BY m.date DESC, m.time DESC`,
      params
    );
    if (result.rows && result.rows.length > 0) {
      return res.json({ success: true, maintenance: result.rows });
    }
    res.json({ success: true, maintenance: memoryStore.maintenance });
  } catch (error) {
    res.json({ success: true, maintenance: memoryStore.maintenance });
  }
});

app.get("/api/outings", requireAuth(), async (req, res) => {
  try {
    const params = [];
    let where = "";
    let ctAssigned = null;

    if (req.session.role === "student") {
      params.push(Number(req.session.userId));
      where = "WHERE o.roll_number = $1";
    } else if (req.session.role === "caretaker") {
      ctAssigned = await getCaretakerAssignedBlocks(req.session.userId, req.session);
      params.push(String(req.session.userId).toLowerCase());

      where = `WHERE (
        LOWER(COALESCE(r.block_id, ho.block_id, '')) IN (SELECT LOWER(block_id) FROM caretaker_hostel WHERE LOWER(employee_id) = LOWER($1))
        OR LOWER(COALESCE(h.name, h2.name, '')) IN (SELECT LOWER(h3.name) FROM caretaker_hostel ch3 JOIN hostel h3 ON h3.block_id = ch3.block_id WHERE LOWER(ch3.employee_id) = LOWER($1))
      )`;
    }

    const result = await query(
      `SELECT o.outing_id, o.roll_number,
              to_char(o.from_date, 'YYYY-MM-DD') AS from_date,
              to_char(o.to_date, 'YYYY-MM-DD') AS to_date,
              o.purpose, o.parent_ph_no,
              to_char(o.date, 'YYYY-MM-DD') AS date,
              o.time, o.status,
              s.name AS student_name, sh.room_id, r.room_number,
              COALESCE(r.block_id, ho.block_id) AS block_id,
              COALESCE(h.name, h2.name) AS hostel_name
       FROM outing o
       LEFT JOIN student s ON s.roll_number = o.roll_number
       LEFT JOIN student_hostel sh ON sh.roll_number = o.roll_number
       LEFT JOIN room r ON r.room_id = sh.room_id
       LEFT JOIN hostel h ON h.block_id = r.block_id
       LEFT JOIN hostel_outing ho ON ho.outing_id = o.outing_id
       LEFT JOIN hostel h2 ON h2.block_id = ho.block_id
       ${where}
       ORDER BY o.date DESC, o.time DESC`,
      params
    );

    if (result.rows && result.rows.length > 0) {
      return res.json({ success: true, outings: result.rows });
    }

    // In-memory fallback
    if (req.session.role === "student") {
      const studentOutings = memoryStore.outings.filter(o => String(o.roll_number) === String(req.session.userId));
      return res.json({ success: true, outings: studentOutings });
    }
    if (req.session.role === "caretaker") {
      if (!ctAssigned) ctAssigned = await getCaretakerAssignedBlocks(req.session.userId, req.session);
      const caretakerOutings = memoryStore.outings.filter(o => outingMatchesCaretaker(o, ctAssigned));
      return res.json({ success: true, outings: caretakerOutings });
    }
    res.json({ success: true, outings: memoryStore.outings });
  } catch (error) {
    if (req.session.role === "student") {
      const studentOutings = memoryStore.outings.filter(o => String(o.roll_number) === String(req.session.userId));
      return res.json({ success: true, outings: studentOutings });
    }
    if (req.session.role === "caretaker") {
      const ctAssigned = await getCaretakerAssignedBlocks(req.session.userId, req.session);
      const caretakerOutings = memoryStore.outings.filter(o => outingMatchesCaretaker(o, ctAssigned));
      return res.json({ success: true, outings: caretakerOutings });
    }
    res.json({ success: true, outings: memoryStore.outings });
  }
});

app.patch("/api/outings/:id", requireAuth(["caretaker", "admin"]), async (req, res) => {
  const statusVal = req.body.status === null ? null : Boolean(req.body.status);
  const outingId = String(req.params.id);
  const cleanOutingId = outingId.replace(/^OUT_/, "");
  let studentRoll = null;
  let outingPurpose = "Outing";
  let fromDate = "";
  let toDate = "";

  try {
    const checkRes = await query("SELECT roll_number, purpose, from_date, to_date FROM outing WHERE outing_id = $1 OR outing_id = $2 OR outing_id = $3", [outingId, `OUT_${outingId}`, cleanOutingId]);
    if (checkRes.rows[0]) {
      studentRoll = checkRes.rows[0].roll_number;
      outingPurpose = checkRes.rows[0].purpose;
      fromDate = checkRes.rows[0].from_date;
      toDate = checkRes.rows[0].to_date;
    }
    await query("UPDATE outing SET status = $1 WHERE outing_id = $2 OR outing_id = $3 OR outing_id = $4", [
      statusVal,
      outingId,
      `OUT_${outingId}`,
      cleanOutingId
    ]);
  } catch (error) {
    console.warn("DB update outing error:", error.message);
  }

  const o = memoryStore.outings.find(item =>
    item.outing_id === outingId ||
    item.outing_id === `OUT_${outingId}` ||
    item.outing_id === cleanOutingId ||
    item.id === outingId ||
    item.id === cleanOutingId ||
    String(item.outing_id).endsWith(cleanOutingId)
  );
  if (o) {
    o.status = statusVal;
    if (!studentRoll) studentRoll = o.roll_number;
    if (!outingPurpose) outingPurpose = o.purpose;
    if (!fromDate) fromDate = o.from_date;
    if (!toDate) toDate = o.to_date;
  }

  // 5. Notify Student after Caretaker / Admin updates outing request
  if (studentRoll && statusVal !== null) {
    const isApproved = statusVal === true;
    const nowFormatted = getNowFormatted();
    const title = isApproved ? "Non-Local Outing Approved! 🎉" : "Outing Request Declined";
    const message = isApproved
      ? `Your non-local outing request (${outingPurpose}) from ${fromDate} to ${toDate} has been officially approved by the Caretaker. Your gate pass is ready!`
      : `Your non-local outing request (${outingPurpose}) was reviewed and declined by the Caretaker.`;

    memoryStore.notifications.unshift({
      id: makeId("NOTIF"),
      roll: String(studentRoll),
      title,
      message,
      dateTime: nowFormatted,
      read: false,
      type: "outing"
    });
  }

  res.json({ success: true, status: statusVal, outing_id: outingId, message: statusVal ? "Outing request approved" : "Outing request declined" });
});

app.post("/api/complaints", requireAuth(["student"]), async (req, res) => {
  const title = String(req.body.title || "").trim();
  const body = String(req.body.body || "").trim();
  if (!title || !body) {
    return res.status(400).json({ success: false, message: "Title and description are required" });
  }
  try {
    let student = await getStudentContext(Number(req.session.userId));
    if (!student?.room_id) {
      if (req.session.room_id || (req.session.room && req.session.block_id)) {
        student = {
          ...student,
          room_id: req.session.room_id || `${req.session.block_id}-${req.session.room}`,
          room_number: req.session.room,
          block_id: req.session.block_id || "SAB_B_03",
          hostel_name: req.session.block || "Sabari"
        };
      }
    }
    if (!student?.room_id) {
      return res.status(400).json({ success: false, message: "No room is allocated yet. Please allocate a room first." });
    }
    const stamp = todayParts();
    const complaintId = makeId("CMP");

    // Ensure student and room exist in DB before inserting complaint
    try {
      await query(
        `INSERT INTO student (roll_number, registered_number, name, year, phone_number, email, password, gender)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (roll_number) DO NOTHING`,
        [student.roll_number, Number(student.registered_number) || student.roll_number, student.name || 'Student', student.year || 3, 9876543210, student.email || `${student.roll_number}@nitandhra.ac.in`, 'Student@001', student.gender || 'Male']
      );
      await query(
        `INSERT INTO room (room_id, block_id, room_number, floor_number)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (room_id) DO NOTHING`,
        [student.room_id, student.block_id, Number(student.room_number) || 101, Math.floor((Number(student.room_number) || 101) / 100)]
      );
      await query(
        `INSERT INTO student_hostel (roll_number, room_id)
         VALUES ($1, $2)
         ON CONFLICT (roll_number, room_id) DO NOTHING`,
        [student.roll_number, student.room_id]
      );
      await query(
        `INSERT INTO complaints (complaint_id, roll_number, room_id, date, time, complaint, status, votes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [complaintId, student.roll_number, student.room_id, stamp.date, stamp.time, `${title}\n\n${body}`, false, 0]
      );
      await query(
        `INSERT INTO hostel_complaints (block_id, complaint_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [student.block_id, complaintId]
      );
    } catch (dbErr) {
      console.warn("DB insert complaint error:", dbErr.message);
    }

    // Always keep memoryStore synced
    memoryStore.complaints.unshift({
      complaint_id: complaintId,
      id: complaintId,
      roll_number: student.roll_number,
      room_id: student.room_id,
      date: stamp.date,
      time: stamp.time,
      complaint: `${title}\n\n${body}`,
      status: false,
      votes: 0,
      student_name: student.name,
      room_number: student.room_number,
      block_id: student.block_id,
      hostel_name: student.hostel_name
    });

    res.status(201).json({ success: true, complaint_id: complaintId });
  } catch (error) {
    console.error("Complaint creation error:", error);
    res.status(500).json({ success: false, message: "Failed to submit complaint" });
  }
});

app.delete("/api/complaints/:id", requireAuth(), async (req, res) => {
  const complaintId = String(req.params.id);
  const userId = String(req.session.userId);
  const role = req.session.role;

  try {
    // 1. Check DB for complaint
    const isStaff = role === "admin" || role === "caretaker";
    const checkQuery = isStaff
      ? "SELECT complaint_id, roll_number FROM complaints WHERE complaint_id = $1 OR complaint_id = $2"
      : "SELECT complaint_id, roll_number FROM complaints WHERE (complaint_id = $1 OR complaint_id = $2) AND roll_number = $3";
    const checkParams = isStaff
      ? [complaintId, `CMP_${complaintId}`]
      : [complaintId, `CMP_${complaintId}`, Number(userId)];

    const existing = await query(checkQuery, checkParams);
    if (!existing.rowCount) {
      // Check if complaint belongs to someone else
      const anyExist = await query("SELECT complaint_id, roll_number FROM complaints WHERE complaint_id = $1 OR complaint_id = $2", [complaintId, `CMP_${complaintId}`]);
      if (anyExist.rowCount && !isStaff) {
        return res.status(403).json({ success: false, message: "You can only delete your own complaints" });
      }

      // MemoryStore fallback
      const memIdx = memoryStore.complaints.findIndex(c => (c.complaint_id === complaintId || c.complaint_id === `CMP_${complaintId}`) && (isStaff || String(c.roll_number) === userId));
      if (memIdx !== -1) {
        memoryStore.complaints.splice(memIdx, 1);
        return res.json({ success: true, message: "Complaint deleted successfully" });
      }
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const realId = existing.rows[0].complaint_id;

    // 2. Delete references
    await query("DELETE FROM complaint_votes WHERE complaint_id = $1", [realId]);
    await query("DELETE FROM hostel_complaints WHERE complaint_id = $1", [realId]);

    // 3. Delete from complaints
    await query("DELETE FROM complaints WHERE complaint_id = $1", [realId]);

    // Remove from memoryStore if present
    const memIdx = memoryStore.complaints.findIndex(c => c.complaint_id === realId);
    if (memIdx !== -1) {
      memoryStore.complaints.splice(memIdx, 1);
    }

    res.json({ success: true, message: "Complaint deleted successfully" });
  } catch (error) {
    console.error("Delete complaint error:", error);
    res.status(500).json({ success: false, message: "Failed to delete complaint" });
  }
});

app.post("/api/complaints/:id/vote", requireAuth(), async (req, res) => {
  const complaintId = String(req.params.id);
  const userId = String(req.session.userId);

  try {
    const complaint = await query(
      "SELECT complaint_id, votes FROM complaints WHERE complaint_id = $1 OR complaint_id = $2",
      [complaintId, `CMP_${complaintId}`]
    );
    if (complaint.rowCount > 0) {
      const realId = complaint.rows[0].complaint_id;
      const existing = await query(
        "SELECT 1 FROM complaint_votes WHERE complaint_id = $1 AND user_id = $2",
        [realId, userId]
      );
      let hasVoted = false;
      if (existing.rowCount > 0) {
        // Toggle OFF (unvote)
        await query(
          "DELETE FROM complaint_votes WHERE complaint_id = $1 AND user_id = $2",
          [realId, userId]
        );
        hasVoted = false;
      } else {
        // Toggle ON (vote)
        await query(
          "INSERT INTO complaint_votes (complaint_id, user_id) VALUES ($1, $2)",
          [realId, userId]
        );
        hasVoted = true;
      }

      const updated = await query(
        `UPDATE complaints
         SET votes = (SELECT count(*)::int FROM complaint_votes WHERE complaint_id = $1)
         WHERE complaint_id = $1
         RETURNING votes`,
        [realId]
      );
      const newVotes = updated.rows[0]?.votes || 0;
      return res.json({
        success: true,
        message: hasVoted ? "Vote registered!" : "Vote removed!",
        votes: newVotes,
        has_voted: hasVoted
      });
    }
  } catch (error) {
    console.error("DB vote error:", error.message);
  }

  // Fallback in-memory vote handler
  if (!memoryStore.complaintVotes) memoryStore.complaintVotes = [];
  const idx = memoryStore.complaintVotes.findIndex(v => (v.complaint_id === complaintId || v.complaint_id === `CMP_${complaintId}`) && String(v.user_id) === userId);
  const memComplaint = memoryStore.complaints.find(c => c.complaint_id === complaintId || c.complaint_id === `CMP_${complaintId}`);

  if (memComplaint) {
    let hasVoted = false;
    if (idx !== -1) {
      // Toggle OFF
      memoryStore.complaintVotes.splice(idx, 1);
      memComplaint.votes = Math.max(0, (memComplaint.votes || 1) - 1);
      hasVoted = false;
    } else {
      // Toggle ON
      memoryStore.complaintVotes.push({ complaint_id: memComplaint.complaint_id, user_id: userId });
      memComplaint.votes = (memComplaint.votes || 0) + 1;
      hasVoted = true;
    }
    return res.json({
      success: true,
      message: hasVoted ? "Vote registered!" : "Vote removed!",
      votes: memComplaint.votes,
      has_voted: hasVoted
    });
  }

  res.status(404).json({ success: false, message: "Complaint not found" });
});



app.get("/api/maintenance", requireAuth(), async (req, res) => {
  try {
    const params = [];
    let where = "";
    if (req.session.role === "student") {
      params.push(Number(req.session.userId));
      where = "WHERE m.roll_number = $1";
    } else if (req.session.role === "caretaker") {
      params.push(req.session.userId);
      where = `WHERE r.block_id IN (
        SELECT block_id FROM caretaker_hostel WHERE employee_id = $1
      )`;
    }
    const result = await query(
      `SELECT m.*, s.name AS student_name, r.room_number, r.block_id, h.name AS hostel_name
       FROM maintenance m
       JOIN student s ON s.roll_number = m.roll_number
       JOIN room r ON r.room_id = m.room_id
       JOIN hostel h ON h.block_id = r.block_id
       ${where}
       ORDER BY m.date DESC, m.time DESC`,
      params
    );
    res.json({ success: true, maintenance: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load maintenance" });
  }
});

app.post("/api/maintenance", requireAuth(["caretaker", "admin", "student"]), async (req, res) => {
  try {
    let rollNumber = req.body.roll_number ? Number(req.body.roll_number) : Number(req.session.userId);
    if (req.session.role === "student") {
      rollNumber = Number(req.session.userId);
    }
    let student = await getStudentContext(rollNumber);
    if (!student?.room_id) {
      if (req.session.room_id || (req.session.room && req.session.block_id)) {
        student = {
          ...student,
          room_id: req.session.room_id || `${req.session.block_id}-${req.session.room}`,
          room_number: req.session.room,
          block_id: req.session.block_id || "SAB_B_03",
          hostel_name: req.session.block || "Sabari"
        };
      }
    }
    if (!student?.room_id) {
      return res.status(400).json({ success: false, message: "Student has no allocated room" });
    }
    const stamp = todayParts();

    // Enforce once-per-day submission for cleaning and mopping
    let alreadySubmitted = false;
    try {
      const existingToday = await query(
        "SELECT maintenance_id FROM maintenance WHERE roll_number = $1 AND date = $2",
        [student.roll_number, stamp.date]
      );
      if (existingToday.rowCount > 0) alreadySubmitted = true;
    } catch (e) {
      if (memoryStore.maintenance.some(m => String(m.roll_number) === String(student.roll_number) && m.date === stamp.date)) {
        alreadySubmitted = true;
      }
    }
    if (alreadySubmitted) {
      return res.status(400).json({
        success: false,
        message: "Cleaning and mopping maintenance can only be submitted once per day. Today's request is already logged."
      });
    }

    const maintenanceId = makeId("MNT");
    try {
      await query(
        `INSERT INTO student (roll_number, registered_number, name, year, phone_number, email, password, gender)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (roll_number) DO NOTHING`,
        [student.roll_number, Number(student.registered_number) || student.roll_number, student.name || 'Student', student.year || 3, 9876543210, student.email || `${student.roll_number}@nitandhra.ac.in`, 'Student@001', student.gender || 'Male']
      );
      await query(
        `INSERT INTO room (room_id, block_id, room_number, floor_number)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (room_id) DO NOTHING`,
        [student.room_id, student.block_id, Number(student.room_number) || 101, Math.floor((Number(student.room_number) || 101) / 100)]
      );
      await query(
        `INSERT INTO student_hostel (roll_number, room_id)
         VALUES ($1, $2)
         ON CONFLICT (roll_number, room_id) DO NOTHING`,
        [student.roll_number, student.room_id]
      );
      await query(
        `INSERT INTO maintenance
         (maintenance_id, roll_number, room_id, cleaning_status, moping_status, remarks, date, time)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          maintenanceId,
          student.roll_number,
          student.room_id,
          Boolean(req.body.cleaning),
          Boolean(req.body.moping),
          String(req.body.remarks || "None").trim() || "None",
          stamp.date,
          stamp.time
        ]
      );
      await query(
        `INSERT INTO hostel_maintenance (block_id, maintenance_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [student.block_id, maintenanceId]
      );
    } catch (dbErr) {
      console.warn("DB insert maintenance error, falling back to memoryStore:", dbErr.message);
    }

    memoryStore.maintenance.unshift({
      maintenance_id: maintenanceId,
      roll_number: student.roll_number,
      room_id: student.room_id,
      cleaning_status: Boolean(req.body.cleaning),
      moping_status: Boolean(req.body.moping),
      remarks: String(req.body.remarks || "None").trim() || "None",
      date: stamp.date,
      time: stamp.time,
      room_number: student.room_number,
      block_id: student.block_id,
      hostel_name: student.hostel_name
    });

    res.status(201).json({ success: true, maintenance_id: maintenanceId });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add maintenance record" });
  }
});

app.post("/api/outings", requireAuth(["student"]), async (req, res) => {
  const from_date = req.body.from_date || req.body.from;
  const to_date = req.body.to_date || req.body.to;
  const purpose = req.body.purpose || (req.body.destination ? `Destination: ${req.body.destination}\n${req.body.reason}` : req.body.reason);
  const parent_ph_no = req.body.parent_ph_no || req.body.parent_phone_no || req.body.phone;

  if (!from_date || !to_date || !purpose || !parent_ph_no) {
    return res.status(400).json({ success: false, message: "All outing fields (from_date, to_date, purpose, parent_ph_no) are required" });
  }
  const parentPhone = Number(digits(parent_ph_no));
  if (!parentPhone) {
    return res.status(400).json({ success: false, message: "Parent phone must be a number" });
  }
  try {
    const student = await getStudentContext(Number(req.session.userId));
    const stamp = todayParts();
    const outingId = makeId("OUT");

    // Ensure student exists in student table
    try {
      if (student) {
        await query(
          `INSERT INTO student (roll_number, registered_number, name, year, phone_number, email, password, gender)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (roll_number) DO NOTHING`,
          [student.roll_number, Number(student.registered_number) || student.roll_number, student.name || 'Student', student.year || 3, parentPhone, student.email || `${student.roll_number}@nitandhra.ac.in`, 'Student@001', student.gender || 'Male']
        );
      }
    } catch (e) {
      console.warn("Student insert in outing error:", e.message);
    }

    let studentBlockId = student?.block_id || req.session.block_id;
    let studentHostelName = student?.hostel_name || req.session.block;

    if (!studentBlockId || !studentHostelName) {
      const fb = fallbackStudents.find(s => String(s.roll_number) === String(req.session.userId));
      if (fb) {
        if (!studentBlockId) studentBlockId = fb.block_id;
        if (!studentHostelName) studentHostelName = fb.hostel_name;
      }
    }
    if (!studentBlockId || !studentHostelName) {
      const alloc = (memoryStore.allocations || []).find(a => String(a.roll) === String(req.session.userId));
      if (alloc) {
        if (!studentHostelName) studentHostelName = alloc.hostel;
      }
    }
    if (!studentBlockId && studentHostelName) {
      const hLower = studentHostelName.toLowerCase();
      studentBlockId = hLower.startsWith('sab') ? 'SAB_B_03' :
                       hLower.startsWith('ind') ? 'IND_B_03' :
                       hLower.startsWith('nag') ? 'NAG_B_02' :
                       hLower.startsWith('vam') ? 'VAM_B_01' :
                       hLower.startsWith('kri') ? 'KRI_G_01' : null;
    }

    try {
      await query(
        `INSERT INTO outing
         (outing_id, roll_number, from_date, to_date, purpose, parent_ph_no, date, time, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [outingId, Number(req.session.userId), from_date, to_date, purpose, parentPhone, stamp.date, stamp.time, null]
      );
      if (studentBlockId) {
        await query(
          `INSERT INTO hostel_outing (block_id, outing_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [studentBlockId, outingId]
        );
      }
    } catch (dbErr) {
      console.warn("DB insert outing error:", dbErr.message);
    }

    // Always unshift into memoryStore.outings!
    memoryStore.outings.unshift({
      outing_id: outingId,
      id: outingId,
      roll_number: Number(req.session.userId),
      student_name: student?.name || req.session.name || 'Student',
      hostel_name: studentHostelName || 'Sabari',
      room_number: student?.room_number || req.session.room || 'Room',
      block_id: studentBlockId || 'SAB_B_03',
      from_date,
      to_date,
      purpose,
      parent_ph_no: String(parent_ph_no),
      date: stamp.date,
      time: stamp.time,
      status: null
    });

    res.status(201).json({ success: true, outing_id: outingId });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to submit outing request: " + error.message });
  }
});

app.get("/api/rooms/available", requireAuth(), async (req, res) => {
  try {
    const blockId = req.query.block_id;
    const params = [];
    let where = "";
    if (blockId) {
      params.push(blockId);
      where = "WHERE r.block_id = $1";
    }
    const result = await query(
      `SELECT r.room_id, r.room_number, r.floor_number, r.block_id, h.name AS hostel_name, h.for_gender, h.seater, h.capacity, h.floors,
              COALESCE(
                (SELECT json_agg(hy.student_year) FROM hostel_year hy WHERE hy.block_id = h.block_id),
                '[]'
              ) AS years,
              count(sh.roll_number)::int AS occupied_count
       FROM room r
       JOIN hostel h ON h.block_id = r.block_id
       LEFT JOIN student_hostel sh ON sh.room_id = r.room_id
       ${where}
       GROUP BY r.room_id, r.room_number, r.floor_number, r.block_id, h.name, h.for_gender, h.seater, h.capacity, h.floors
       HAVING count(sh.roll_number) < h.seater
       ORDER BY r.block_id, r.floor_number, r.room_number
       LIMIT 3000`,
      params
    );
    res.json({ success: true, rooms: result.rows });
  } catch (error) {
    res.json({
      success: true,
      rooms: [
        { room_id: 'SAB_B_03-101', hostel_name: 'Sabari', for_gender: 'Male', years: [3], room_number: 101, floor_number: 1, occupied_count: 0, seater: 2 },
        { room_id: 'SAB_B_03-112', hostel_name: 'Sabari', for_gender: 'Male', years: [3], room_number: 112, floor_number: 1, occupied_count: 1, seater: 3 },
        { room_id: 'SAB_B_03-201', hostel_name: 'Sabari', for_gender: 'Male', years: [3], room_number: 201, floor_number: 2, occupied_count: 0, seater: 2 },
        { room_id: 'IND_B_03-101', hostel_name: 'Indravathi', for_gender: 'Male', years: [3], room_number: 101, floor_number: 1, occupied_count: 0, seater: 2 },
        { room_id: 'IND_B_03-243', hostel_name: 'Indravathi', for_gender: 'Male', years: [3], room_number: 243, floor_number: 2, occupied_count: 1, seater: 2 },
        { room_id: 'NAG_B_02-101', hostel_name: 'Nagavalli', for_gender: 'Male', years: [2], room_number: 101, floor_number: 1, occupied_count: 0, seater: 2 },
        { room_id: 'NAG_B_02-333', hostel_name: 'Nagavalli', for_gender: 'Male', years: [2], room_number: 333, floor_number: 3, occupied_count: 0, seater: 2 },
        { room_id: 'VAM_B_01-101', hostel_name: 'Vamsadhara', for_gender: 'Male', years: [1], room_number: 101, floor_number: 1, occupied_count: 0, seater: 2 },
        { room_id: 'KRI_G_01-101', hostel_name: 'Krishna', for_gender: 'Female', years: [1, 2], room_number: 101, floor_number: 1, occupied_count: 0, seater: 2 },
        { room_id: 'KRI_G_01-201', hostel_name: 'Krishna', for_gender: 'Female', years: [1, 2], room_number: 201, floor_number: 2, occupied_count: 0, seater: 2 }
      ]
    });
  }
});

app.post("/api/rooms/allocate", requireAuth(["student", "admin"]), async (req, res) => {
  try {
    const rollNumber = req.session.role === "student" ? Number(req.session.userId) : Number(req.body.roll_number);
    const roomId = req.body.room_id;
    if (!roomId) {
      return res.status(400).json({ success: false, message: "Room ID is required" });
    }
    const roomCheck = await query(
      `SELECT r.room_id, h.seater, count(sh.roll_number)::int AS occupied
       FROM room r
       JOIN hostel h ON h.block_id = r.block_id
       LEFT JOIN student_hostel sh ON sh.room_id = r.room_id
       WHERE r.room_id = $1
       GROUP BY r.room_id, h.seater`,
      [roomId]
    );
    if (!roomCheck.rowCount) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }
    if (roomCheck.rows[0].occupied >= roomCheck.rows[0].seater) {
      return res.status(400).json({ success: false, message: "Room is already full" });
    }
    await query("DELETE FROM student_hostel WHERE roll_number = $1", [rollNumber]);
    await query(
      "INSERT INTO student_hostel (roll_number, room_id) VALUES ($1, $2)",
      [rollNumber, roomId]
    );
    const student = await getStudentContext(rollNumber);
    const user = publicUser("student", student);
    // Update active session if allocating for self
    if (req.session.role === "student") {
      req.session.room = user.room;
      req.session.block = user.block;
      req.session.block_id = user.block_id;
      req.session.room_id = user.room_id;
    }
    res.json({ success: true, message: "Room allocated successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to allocate room" });
  }
});

app.post("/api/rooms/vacate", requireAuth(["student", "admin"]), async (req, res) => {
  try {
    const rollNumber = req.session.role === "student" ? Number(req.session.userId) : Number(req.body.roll_number);
    await query("DELETE FROM student_hostel WHERE roll_number = $1", [rollNumber]);
    if (req.session.role === "student") {
      req.session.room = null;
      req.session.block = null;
      req.session.block_id = null;
      req.session.room_id = null;
    }
    res.json({ success: true, message: "Room vacated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to vacate room" });
  }
});

app.get("/api/inspection", requireAuth(["caretaker", "admin"]), async (req, res) => {
  try {
    const params = [];
    let where = "";
    if (req.session.role === "caretaker") {
      params.push(req.session.userId);
      where = `WHERE r.block_id IN (SELECT block_id FROM caretaker_hostel WHERE employee_id = $1)`;
    }
    const result = await query(
      `SELECT r.room_id, r.room_number, r.floor_number, r.block_id, h.name AS hostel_name,
              COALESCE(json_agg(json_build_object('roll', s.roll_number, 'name', s.name, 'phone', s.phone_number)) FILTER (WHERE s.roll_number IS NOT NULL), '[]') AS students
       FROM room r
       JOIN hostel h ON h.block_id = r.block_id
       LEFT JOIN student_hostel sh ON sh.room_id = r.room_id
       LEFT JOIN student s ON s.roll_number = sh.roll_number
       ${where}
       GROUP BY r.room_id, r.room_number, r.floor_number, r.block_id, h.name
       ORDER BY r.block_id, r.room_number
       LIMIT 100`,
      params
    );
    res.json({ success: true, rooms: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load room inspection" });
  }
});

app.get("/api/users", requireAuth(["admin"]), async (req, res) => {
  try {
    const students = await query("SELECT roll_number, registered_number, name, email, phone_number, year, gender FROM student ORDER BY roll_number");
    const caretakers = await query(`
      SELECT c.employee_id, c.name, c.email, c.phone_number,
             COALESCE(string_agg(DISTINCT h.name, ', '), 'All Blocks') AS hostel_name
      FROM caretaker c
      LEFT JOIN caretaker_hostel ch ON ch.employee_id = c.employee_id
      LEFT JOIN hostel h ON h.block_id = ch.block_id
      GROUP BY c.employee_id, c.name, c.email, c.phone_number
      ORDER BY c.employee_id
    `);
    const admins = await query("SELECT key FROM admin ORDER BY key");
    res.json({ success: true, students: students.rows, caretakers: caretakers.rows, admins: admins.rows });
  } catch (error) {
    res.status(500).json({
      success: true,
      students: fallbackStudents,
      caretakers: fallbackCaretakers.map(c => ({
        employee_id: c.employee_id,
        name: c.name,
        email: c.email,
        phone_number: c.phone_number,
        hostel_name: (c.blocks && c.blocks[0]?.name) || 'Sabari'
      })),
      admins: fallbackAdmins
    });
  }
});

// Admin Create Caretaker & Assign to Hostel Block
app.post("/api/admin/caretakers", requireAuth(["admin"]), async (req, res) => {
  const { name, email, phone_number, password, hostel_name, employee_id } = req.body;
  if (!name || !email || !hostel_name || !password) {
    return res.status(400).json({ success: false, message: "Name, email, hostel name, and password are required" });
  }

  // Find block_id for hostel_name
  let blockId = null;
  let resolvedName = hostel_name;
  try {
    const hRes = await query(
      "SELECT block_id, name FROM hostel WHERE LOWER(name) = LOWER($1) OR block_id ILIKE $1 LIMIT 1",
      [String(hostel_name).trim()]
    );
    if (hRes.rows[0]) {
      blockId = hRes.rows[0].block_id;
      resolvedName = hRes.rows[0].name;
    }
  } catch (e) {
    // fallback
  }

  if (!blockId) {
    const hLower = String(hostel_name).toLowerCase();
    blockId = hLower.startsWith('sab') ? 'SAB_B_03' :
              (hLower.startsWith('ind') ? 'IND_B_03' :
              (hLower.startsWith('nag') ? 'NAG_B_02' :
              (hLower.startsWith('kri') ? 'KRI_G_01' : 'VAM_B_01')));
  }

  const empId = employee_id ? String(employee_id).trim().slice(0, 10) : `EMP_${Math.floor(100 + Math.random() * 900)}`;
  const phone = Number(digits(phone_number)) || 9876543210;

  try {
    const existing = await query("SELECT employee_id FROM caretaker WHERE employee_id = $1 OR LOWER(email) = LOWER($2)", [empId, email.trim()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ success: false, message: "A caretaker with this Employee ID or Email already exists" });
    }

    await query(
      "INSERT INTO caretaker (employee_id, name, phone_number, email, password) VALUES ($1, $2, $3, $4, $5)",
      [empId, name.trim(), phone, email.trim(), password.trim()]
    );
    await query(
      "INSERT INTO caretaker_hostel (employee_id, block_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [empId, blockId]
    );
  } catch (e) {
    console.warn("DB create caretaker error:", e.message);
  }

  // Add to fallbackCaretakers
  const ctObj = {
    employee_id: empId,
    name: name.trim(),
    email: email.trim(),
    password: password.trim(),
    phone_number: String(phone),
    blocks: [{ block_id: blockId, name: resolvedName }]
  };
  fallbackCaretakers.unshift(ctObj);

  res.status(201).json({
    success: true,
    message: `Caretaker ${name} created successfully and assigned to ${resolvedName}`,
    caretaker: { employee_id: empId, name: name.trim(), email: email.trim(), phone_number: String(phone), hostel_name: resolvedName, block_id: blockId }
  });
});

// Admin Update Caretaker Assigned Block & Details
const handleUpdateCaretaker = async (req, res) => {
  const empId = String(req.params.id || "").trim();
  const { hostel_name, name, phone_number, email } = req.body;

  if (!empId) {
    return res.status(400).json({ success: false, message: "Employee ID is required" });
  }
  if (!hostel_name) {
    return res.status(400).json({ success: false, message: "Hostel name is required to assign block" });
  }

  // Resolve block_id for hostel_name
  let blockId = null;
  let resolvedName = hostel_name;
  try {
    const hRes = await query(
      "SELECT block_id, name FROM hostel WHERE LOWER(name) = LOWER($1) OR block_id ILIKE $1 LIMIT 1",
      [String(hostel_name).trim()]
    );
    if (hRes.rows[0]) {
      blockId = hRes.rows[0].block_id;
      resolvedName = hRes.rows[0].name;
    }
  } catch (e) {
    // fallback
  }

  if (!blockId) {
    const hLower = String(hostel_name).toLowerCase();
    blockId = hLower.startsWith('sab') ? 'SAB_B_03' :
              (hLower.startsWith('ind') ? 'IND_B_03' :
              (hLower.startsWith('nag') ? 'NAG_B_02' :
              (hLower.startsWith('kri') ? 'KRI_G_01' : 'VAM_B_01')));
  }

  try {
    // Update caretaker info if provided
    if (name || phone_number || email) {
      await query(
        `UPDATE caretaker
         SET name = COALESCE($1, name),
             phone_number = COALESCE($2, phone_number),
             email = COALESCE($3, email)
         WHERE LOWER(employee_id) = LOWER($4)`,
        [name ? name.trim() : null, phone_number ? Number(digits(phone_number)) : null, email ? email.trim() : null, empId]
      );
    }

    // Replace assigned blocks in caretaker_hostel
    await query("DELETE FROM caretaker_hostel WHERE LOWER(employee_id) = LOWER($1)", [empId]);
    await query(
      "INSERT INTO caretaker_hostel (employee_id, block_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [empId, blockId]
    );
  } catch (e) {
    console.warn("DB update caretaker error:", e.message);
  }

  // Update fallbackCaretakers
  const ct = fallbackCaretakers.find(c => c.employee_id.toLowerCase() === empId.toLowerCase());
  if (ct) {
    if (name) ct.name = name.trim();
    if (phone_number) ct.phone_number = String(phone_number);
    if (email) ct.email = email.trim();
    ct.blocks = [{ block_id: blockId, name: resolvedName }];
  }

  // Update active sessions if present
  for (const [token, sess] of sessions.entries()) {
    if (sess.role === "caretaker" && sess.userId?.toLowerCase() === empId.toLowerCase()) {
      sess.blocks = [{ block_id: blockId, name: resolvedName }];
    }
  }

  res.json({
    success: true,
    message: `Caretaker assigned block updated to ${resolvedName}`,
    caretaker: { employee_id: empId, hostel_name: resolvedName, block_id: blockId }
  });
};

app.put("/api/admin/caretakers/:id", requireAuth(["admin"]), handleUpdateCaretaker);
app.patch("/api/admin/caretakers/:id", requireAuth(["admin"]), handleUpdateCaretaker);

// Admin Delete Caretaker
app.delete("/api/admin/caretakers/:id", requireAuth(["admin"]), async (req, res) => {
  const empId = String(req.params.id || "").trim();
  if (!empId) {
    return res.status(400).json({ success: false, message: "Employee ID is required" });
  }

  try {
    await query("DELETE FROM caretaker_hostel WHERE LOWER(employee_id) = LOWER($1)", [empId]);
    await query("DELETE FROM caretaker WHERE LOWER(employee_id) = LOWER($1)", [empId]);
    deletedCaretakerIds.add(empId.toUpperCase());

    const idx = fallbackCaretakers.findIndex(c => c.employee_id.toLowerCase() === empId.toLowerCase());
    if (idx !== -1) {
      fallbackCaretakers.splice(idx, 1);
    }

    for (const [token, sess] of sessions.entries()) {
      if (sess.role === "caretaker" && sess.userId?.toLowerCase() === empId.toLowerCase()) {
        sessions.delete(token);
      }
    }

    return res.json({
      success: true,
      message: `Caretaker ${empId} removed successfully`
    });
  } catch (error) {
    console.error("Delete caretaker error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove caretaker: " + error.message });
  }
});

app.get("/api/students", requireAuth(["caretaker", "admin"]), async (req, res) => {
  try {
    const params = [];
    let where = "";
    if (req.session.role === "caretaker") {
      params.push(req.session.userId);
      where = `WHERE r.block_id IN (
        SELECT block_id FROM caretaker_hostel WHERE employee_id = $1
      )`;
    }
    const result = await query(
      `SELECT s.roll_number, s.registered_number, s.name, s.year, s.phone_number, s.email, s.gender,
              r.room_number, r.block_id, h.name AS hostel_name
       FROM student s
       LEFT JOIN student_hostel sh ON sh.roll_number = s.roll_number
       LEFT JOIN room r ON r.room_id = sh.room_id
       LEFT JOIN hostel h ON h.block_id = r.block_id
       ${where}
       ORDER BY s.roll_number`,
      params
    );
    res.json({ success: true, students: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load students" });
  }
});

app.get("/api/reports", requireAuth(["admin"]), async (req, res) => {
  try {
    const result = await query(`
      SELECT
        (SELECT count(*)::int FROM student) AS students,
        (SELECT count(*)::int FROM caretaker) AS caretakers,
        (SELECT count(*)::int FROM hostel) AS hostels,
        (SELECT count(*)::int FROM room) AS rooms,
        (SELECT count(*)::int FROM complaints) AS complaints,
        (SELECT count(*)::int FROM outing) AS outings,
        (SELECT count(*)::int FROM maintenance) AS maintenance
    `);
    res.json({ success: true, reports: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load reports" });
  }
});

// ==================== ALLOCATION & EVACUATION MANAGEMENT ====================
app.get("/api/admin/allocations", requireAuth(["admin"]), async (req, res) => {
  res.json({ success: true, allocations: memoryStore.allocations });
});

app.post("/api/admin/allocations/status", requireAuth(["admin"]), async (req, res) => {
  const { id, roll, status } = req.body;
  if (!status) return res.status(400).json({ success: false, message: "Status is required" });
  const item = memoryStore.allocations.find(a => (id && a.id === id) || (roll && a.roll === String(roll)));
  if (!item) {
    return res.status(404).json({ success: false, message: "Allocation record not found" });
  }

  item.status = status;
  const rollStr = String(item.roll);
  const nowFormatted = getNowFormatted();

  if (status === "Verified") {
    const hLower = (item.hostel || 'Sabari').toLowerCase();
    const bId = hLower.startsWith('sab') ? 'SAB_B_03' :
                (hLower.startsWith('ind') ? 'IND_B_03' :
                (hLower.startsWith('nag') ? 'NAG_B_02' :
                (hLower.startsWith('kri') ? 'KRI_G_01' : 'VAM_B_01')));
    const roomNum = Number(item.room) || 101;
    const targetRoomId = `${bId}-${roomNum}`;

    // 1. Update fallbackStudents
    let st = fallbackStudents.find(s => String(s.roll_number) === rollStr);
    if (!st) {
      st = {
        roll_number: Number(rollStr),
        registered_number: Number(rollStr),
        name: item.name || 'Student',
        year: Number(item.year) || 3,
        email: `${rollStr}@nitandhra.ac.in`,
        password: 'Student@001',
        gender: 'Male',
        phone_number: '9876543210'
      };
      fallbackStudents.push(st);
    }
    st.room_number = String(roomNum);
    st.hostel_name = item.hostel;
    st.block_id = bId;
    st.room_id = targetRoomId;

    // 2. Update active sessions
    for (const [t, s] of sessions.entries()) {
      if (String(s.userId) === rollStr || String(s.roll) === rollStr) {
        s.room = String(roomNum);
        s.block = item.hostel;
        s.block_id = bId;
        s.room_id = targetRoomId;
      }
    }

    // 3. PostgreSQL update: ensure student, ensure room, delete old, insert new student_hostel
    try {
      await query(
        `INSERT INTO student (roll_number, registered_number, name, year, phone_number, email, password, gender)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (roll_number) DO UPDATE SET
           name = EXCLUDED.name,
           year = EXCLUDED.year`,
        [Number(rollStr), Number(item.roll) || Number(rollStr), item.name || 'Student', Number(item.year) || 3, 9876543210, `${rollStr}@nitandhra.ac.in`, 'Student@001', 'Male']
      );
      await query(
        `INSERT INTO room (room_id, block_id, room_number, floor_number)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (room_id) DO NOTHING`,
        [targetRoomId, bId, roomNum, Math.floor(roomNum / 100)]
      );
      await query("DELETE FROM student_hostel WHERE roll_number = $1", [Number(rollStr)]);
      await query("INSERT INTO student_hostel (roll_number, room_id) VALUES ($1, $2)", [Number(rollStr), targetRoomId]);
    } catch (e) {
      console.warn("DB room allocation sync error:", e.message);
    }

    // 4. Send notification to student
    memoryStore.notifications.unshift({
      id: makeId("NOTIF"),
      roll: rollStr,
      title: "Hostel Room Allocation Verified! 🎉",
      message: `Your hostel room allocation in ${item.hostel} (Room ${item.room}) has been officially verified and approved by Admin. Your room is active!`,
      dateTime: nowFormatted,
      read: false,
      type: "allocation"
    });
  } else if (status === "Declined") {
    memoryStore.notifications.unshift({
      id: makeId("NOTIF"),
      roll: rollStr,
      title: "Hostel Room Allocation Declined",
      message: `Your room allocation in ${item.hostel} was declined. Please verify your payment fee receipt and submit again.`,
      dateTime: nowFormatted,
      read: false,
      type: "allocation"
    });
  }

  res.json({ success: true, message: `Status updated to ${status}`, allocation: item });
});

app.get("/api/admin/evacuations", requireAuth(["admin"]), async (req, res) => {
  res.json({ success: true, evacuations: memoryStore.evacuations });
});

app.post("/api/admin/evacuations/status", requireAuth(["admin"]), async (req, res) => {
  const { id, roll, status } = req.body;
  if (!status) return res.status(400).json({ success: false, message: "Status is required" });
  const item = memoryStore.evacuations.find(e => (id && e.id === id) || (roll && e.roll === String(roll)));
  if (!item) {
    return res.status(404).json({ success: false, message: "Evacuation record not found" });
  }

  item.status = status;
  const rollStr = String(item.roll);
  const nowFormatted = getNowFormatted();

  if (status === "Verified") {
    // 1. Clear room in fallbackStudents
    const st = fallbackStudents.find(s => String(s.roll_number) === rollStr);
    if (st) {
      st.room_number = null;
      st.hostel_name = null;
      st.block_id = null;
      st.room_id = null;
    }
    // 2. Clear in active sessions
    for (const [t, s] of sessions.entries()) {
      if (String(s.userId) === rollStr || String(s.roll) === rollStr) {
        s.room = null;
        s.block = null;
        s.block_id = null;
        s.room_id = null;
      }
    }
    // 3. Try PostgreSQL update
    try {
      await query("DELETE FROM student_hostel WHERE roll_number = $1", [Number(rollStr)]);
    } catch (e) {
      // offline fallback
    }
    // 4. Send notification to student
    memoryStore.notifications.unshift({
      id: makeId("NOTIF"),
      roll: rollStr,
      title: "Hostel Room Evacuation Verified! ✅",
      message: `Your hostel room evacuation for ${item.hostel} (Room ${item.room}) has been officially approved and verified by Admin. Dues clearance complete.`,
      dateTime: nowFormatted,
      read: false,
      type: "evacuation"
    });
  }

  res.json({ success: true, message: `Status updated to ${status}`, evacuation: item });
});

// ==================== ALLOCATION & EVACUATION WINDOW MANAGEMENT ====================
app.get("/api/windows", requireAuth(), async (req, res) => {
  res.json({
    success: true,
    windows: memoryStore.windows,
    isAllocationOpen: isWindowOpen(memoryStore.windows.allocation),
    isEvacuationOpen: isWindowOpen(memoryStore.windows.evacuation)
  });
});

app.post("/api/admin/windows/allocation", requireAuth(["admin"]), async (req, res) => {
  const { startDate, endDate, active } = req.body;
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: "Start date and end date are required" });
  }
  memoryStore.windows.allocation = {
    startDate,
    endDate,
    active: active !== undefined ? Boolean(active) : true
  };
  res.json({ success: true, message: "Allocation window updated successfully", window: memoryStore.windows.allocation });
});

app.post("/api/admin/windows/evacuation", requireAuth(["admin"]), async (req, res) => {
  const { startDate, endDate, active } = req.body;
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: "Start date and end date are required" });
  }
  memoryStore.windows.evacuation = {
    startDate,
    endDate,
    active: active !== undefined ? Boolean(active) : true
  };
  res.json({ success: true, message: "Evacuation window updated successfully", window: memoryStore.windows.evacuation });
});

// ==================== CONTACT US MANAGEMENT ====================
app.get("/api/contacts", async (req, res) => {
  res.json({ success: true, contacts: memoryStore.contactUs });
});

app.put("/api/admin/contacts", requireAuth(["admin"]), async (req, res) => {
  const { chiefWarden, hostelOffice, emergency } = req.body;
  if (chiefWarden) {
    memoryStore.contactUs.chiefWarden = { ...memoryStore.contactUs.chiefWarden, ...chiefWarden };
  }
  if (hostelOffice) {
    memoryStore.contactUs.hostelOffice = { ...memoryStore.contactUs.hostelOffice, ...hostelOffice };
  }
  if (emergency) {
    memoryStore.contactUs.emergency = { ...memoryStore.contactUs.emergency, ...emergency };
  }
  res.json({ success: true, message: "Contact information updated successfully", contacts: memoryStore.contactUs });
});

// Student Apply for Room Allocation (with PDF fee receipt and separate Hostel, Floor, Room, Cot inputs)
app.post("/api/rooms/apply-allocation", requireAuth(["student"]), async (req, res) => {
  const rollNumber = String(req.session.userId);
  const { room_id, hostel, floor, room, cot, receiptPdf, receiptName } = req.body;

  // Enforce allocation window dates
  if (!isWindowOpen(memoryStore.windows.allocation)) {
    return res.status(400).json({
      success: false,
      message: `Room allocation is currently closed. Applications can only be made between ${memoryStore.windows.allocation.startDate} and ${memoryStore.windows.allocation.endDate}.`
    });
  }

  if (!receiptPdf) {
    return res.status(400).json({ success: false, message: "Fee receipt PDF document is required" });
  }

  let hostelName = hostel ? String(hostel).trim() : "Sabari";
  let roomNumber = room ? String(room).trim() : "112";
  let floorNumber = floor ? String(floor).trim() : String(Math.floor(Number(roomNumber) / 100) || 1);
  let cotNumber = cot ? String(cot).trim() : "Cot 1";
  let targetRoomId = room_id;

  if (!targetRoomId) {
    const hLower = hostelName.toLowerCase();
    const bId = hLower.startsWith('sab') ? 'SAB_B_03' :
                (hLower.startsWith('ind') ? 'IND_B_03' :
                (hLower.startsWith('nag') ? 'NAG_B_02' :
                (hLower.startsWith('kri') ? 'KRI_G_01' : 'VAM_B_01')));
    targetRoomId = `${bId}-${roomNumber}`;
  }

  // Validate student gender and academic year eligibility against hostel
  try {
    const student = (await getStudentContext(Number(rollNumber))) || req.session;
    const studentGender = (student.gender || 'Male').toLowerCase();
    const studentYear = Number(student.year) || 3;

    const hCheck = await query(
      `SELECT h.block_id, h.for_gender,
              COALESCE((SELECT json_agg(hy.student_year) FROM hostel_year hy WHERE hy.block_id = h.block_id), '[]') AS years
       FROM hostel h
       WHERE LOWER(h.name) = LOWER($1) OR h.block_id = $2`,
      [hostelName, targetRoomId.split('-')[0]]
    );
    if (hCheck.rows[0]) {
      const hData = hCheck.rows[0];
      if (hData.for_gender && hData.for_gender.toLowerCase() !== studentGender && hData.for_gender !== 'Co-ed') {
        return res.status(400).json({
          success: false,
          message: `${hostelName} is designated for ${hData.for_gender} students only.`
        });
      }
      const eligibleYears = hData.years || [];
      if (eligibleYears.length && !eligibleYears.includes(studentYear)) {
        return res.status(400).json({
          success: false,
          message: `${hostelName} is only eligible for ${eligibleYears.map(y => `Year ${y}`).join(', ')} students.`
        });
      }
    }
  } catch (valErr) {
    console.warn("Hostel eligibility check warning:", valErr.message);
  }

  let item = memoryStore.allocations.find(a => a.roll === rollNumber);
  const nowFormatted = getNowFormatted();

  if (!item) {
    item = {
      id: makeId("ALC"),
      dateTime: nowFormatted,
      roll: rollNumber,
      name: req.session.name || 'Student',
      year: String(req.session.year || 3),
      hostel: hostelName,
      floor: String(floorNumber),
      room: String(roomNumber),
      cot: cotNumber,
      room_id: targetRoomId,
      receiptPdf,
      receiptName: receiptName || `Fee_Receipt_${rollNumber}.pdf`,
      receiptRef: 'REC-DUK' + Math.floor(100000 + Math.random() * 900000),
      status: 'Review' // Pending Admin verification
    };
    memoryStore.allocations.unshift(item);
  } else {
    item.dateTime = nowFormatted;
    item.hostel = hostelName;
    item.floor = String(floorNumber);
    item.room = String(roomNumber);
    item.cot = cotNumber;
    item.room_id = targetRoomId;
    item.receiptPdf = receiptPdf;
    item.receiptName = receiptName || `Fee_Receipt_${rollNumber}.pdf`;
    item.status = 'Review';
  }

  res.json({
    success: true,
    message: `Room allocation submitted for ${hostelName} - Floor ${floorNumber}, Room ${roomNumber} (${cotNumber}) with PDF fee receipt. Awaiting Admin verification.`,
    allocation: item
  });
});

app.get("/api/rooms/my-allocation", requireAuth(["student"]), async (req, res) => {
  const rollNumber = String(req.session.userId);
  const item = memoryStore.allocations.find(a => a.roll === rollNumber);
  res.json({ success: true, allocation: item || null });
});

// Student Apply for Room Evacuation (Enforces evacuation window dates)
app.post("/api/rooms/apply-evacuation", requireAuth(["student"]), async (req, res) => {
  const rollNumber = String(req.session.userId);
  const { leave_date, reason } = req.body;

  // Enforce evacuation window dates
  if (!isWindowOpen(memoryStore.windows.evacuation)) {
    return res.status(400).json({
      success: false,
      message: `Hostel room evacuation is currently closed. Applications can only be made between ${memoryStore.windows.evacuation.startDate} and ${memoryStore.windows.evacuation.endDate}.`
    });
  }

  if (!leave_date) {
    return res.status(400).json({ success: false, message: "Leaving date is required" });
  }

  const student = fallbackStudents.find(s => String(s.roll_number) === rollNumber) || req.session;
  const nowFormatted = getNowFormatted();

  let item = memoryStore.evacuations.find(e => e.roll === rollNumber);
  if (!item) {
    item = {
      id: makeId("EVAC"),
      dateTime: nowFormatted,
      roll: rollNumber,
      name: req.session.name || 'Student',
      year: String(req.session.year || 3),
      hostel: student.hostel_name || student.block || 'Sabari',
      room: String(student.room_number || student.room || '112'),
      leaveDate: leave_date,
      reason: reason || 'Course completion',
      status: 'Review' // Pending Admin verification
    };
    memoryStore.evacuations.unshift(item);
  } else {
    item.dateTime = nowFormatted;
    item.leaveDate = leave_date;
    item.reason = reason || item.reason;
    item.status = 'Review';
  }

  res.json({
    success: true,
    message: "Room evacuation applied. Waiting for Admin verification.",
    evacuation: item
  });
});

app.get("/api/rooms/my-evacuation", requireAuth(["student"]), async (req, res) => {
  const rollNumber = String(req.session.userId);
  const item = memoryStore.evacuations.find(e => e.roll === rollNumber);
  res.json({ success: true, evacuation: item || null });
});

// Notification endpoints
app.get("/api/notifications", requireAuth(), async (req, res) => {
  const userId = String(req.session.userId);
  const notifs = memoryStore.notifications.filter(n => !n.roll || String(n.roll) === userId);
  res.json({ success: true, notifications: notifs });
});

app.post("/api/notifications/:id/read", requireAuth(), async (req, res) => {
  const { id } = req.params;
  const notif = memoryStore.notifications.find(n => n.id === id);
  if (notif) notif.read = true;
  res.json({ success: true });
});

app.post("/api/notifications/mark-all-read", requireAuth(), async (req, res) => {
  const userId = String(req.session.userId);
  memoryStore.notifications.forEach(n => {
    if (!n.roll || String(n.roll) === userId) {
      n.read = true;
    }
  });
  res.json({ success: true });
});

app.post("/api/rooms/upload-receipt", requireAuth(["student"]), async (req, res) => {
  const rollNumber = String(req.session.userId);
  const { receiptPdf, receiptName } = req.body;
  if (!receiptPdf) {
    return res.status(400).json({ success: false, message: "PDF receipt data is required" });
  }
  let item = memoryStore.allocations.find(a => a.roll === rollNumber);
  if (!item) {
    const student = await getStudentContext(Number(rollNumber));
    item = {
      id: makeId("ALC"),
      dateTime: getNowFormatted(),
      roll: rollNumber,
      name: student?.name || req.session.name || 'Student',
      year: String(student?.year || 1),
      hostel: student?.hostel_name || 'Sabari',
      room: student?.room_number || '101',
      receiptPdf,
      receiptName: receiptName || `Fee_Receipt_${rollNumber}.pdf`,
      receiptRef: 'REC-DUK' + Math.floor(100000 + Math.random() * 900000),
      status: 'Review'
    };
    memoryStore.allocations.unshift(item);
  } else {
    item.receiptPdf = receiptPdf;
    item.receiptName = receiptName || `Fee_Receipt_${rollNumber}.pdf`;
  }
  res.json({ success: true, message: "Fee receipt PDF uploaded successfully", allocation: item });
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

async function syncFallbackStudents() {
  for (const s of fallbackStudents) {
    try {
      const phone = Number(String(s.phone_number || "9876543210").replace(/\D/g, '')) || 9876543210;
      await query(
        `INSERT INTO student (roll_number, registered_number, name, year, phone_number, email, password, gender)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (roll_number) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           year = EXCLUDED.year`,
        [Number(s.roll_number), Number(s.registered_number || s.roll_number), s.name, Number(s.year) || 3, phone, s.email, s.password, s.gender || 'Male']
      );
      if (s.room_number) {
        const hLower = (s.hostel_name || s.block || '').toLowerCase();
        const bId = s.block_id || (hLower.startsWith('sab') ? 'SAB_B_03' : (hLower.startsWith('ind') ? 'IND_B_03' : 'NAG_B_02'));
        const rNum = Number(s.room_number) || 101;
        const roomId = `${bId}-${rNum}`;
        await query(
          `INSERT INTO room (room_id, block_id, room_number, floor_number) VALUES ($1, $2, $3, $4) ON CONFLICT (room_id) DO NOTHING`,
          [roomId, bId, rNum, Math.floor(rNum / 100)]
        );
        await query(
          `INSERT INTO student_hostel (roll_number, room_id) VALUES ($1, $2) ON CONFLICT (roll_number, room_id) DO NOTHING`,
          [Number(s.roll_number), roomId]
        );
      }
    } catch (e) {
      // offline fallback
    }
  }
}

async function syncAllHostels() {
  try {
    const hostels = (await query('SELECT block_id, floors, seater, capacity FROM hostel')).rows;
    for (const h of hostels) {
      await syncHostelRooms(h.block_id, h.floors, h.seater, h.capacity);
    }
  } catch (e) {
    console.warn("syncAllHostels error:", e.message);
  }
}

async function syncSeedData() {
  // 1. Ensure Caretaker EMP_001, EMP_002, EMP_003 exist in DB
  for (const c of fallbackCaretakers) {
    if (deletedCaretakerIds.has(c.employee_id.toUpperCase())) continue;
    try {
      const phone = Number(String(c.phone_number || "9096735463").replace(/\D/g, '')) || 9096735463;
      await query(
        `INSERT INTO caretaker (employee_id, name, phone_number, email, password)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (employee_id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           password = EXCLUDED.password`,
        [c.employee_id, c.name, phone, c.email, c.password]
      );
      // Map to only their assigned blocks from fallbackCaretakers
      const blocksToAssign = (c.blocks || []).map(b => b.block_id);

      for (const bId of blocksToAssign) {
        await query(
          `INSERT INTO caretaker_hostel (employee_id, block_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [c.employee_id, bId]
        );
      }
    } catch (e) {
      console.warn("syncSeedData caretaker error:", e.message);
    }
  }

  // 2. Ensure initial complaints exist in DB
  for (const comp of memoryStore.complaints) {
    try {
      const bId = comp.block_id || 'SAB_B_03';
      const rNum = Number(String(comp.room_number || "112").replace(/\D/g, '')) || 101;
      const rId = comp.room_id || `${bId}-${rNum}`;
      await query(
        `INSERT INTO room (room_id, block_id, room_number, floor_number) VALUES ($1, $2, $3, $4) ON CONFLICT (room_id) DO NOTHING`,
        [rId, bId, rNum, Math.floor(rNum / 100)]
      );
      await query(
        `INSERT INTO complaints (complaint_id, roll_number, room_id, date, time, complaint, status, votes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (complaint_id) DO UPDATE SET
           status = EXCLUDED.status,
           votes = EXCLUDED.votes`,
        [comp.complaint_id, comp.roll_number, rId, comp.date, comp.time, comp.complaint, comp.status, comp.votes || 0]
      );
      await query(
        `INSERT INTO hostel_complaints (block_id, complaint_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [bId, comp.complaint_id]
      );
    } catch (e) {
      console.warn("syncSeedData complaint error:", e.message);
    }
  }

  // 3. Ensure initial outings exist in DB
  for (const out of memoryStore.outings) {
    try {
      const phone = Number(String(out.parent_ph_no || "9988776655").replace(/\D/g, '')) || 9988776655;
      await query(
        `INSERT INTO outing (outing_id, roll_number, from_date, to_date, purpose, parent_ph_no, date, time, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (outing_id) DO UPDATE SET
           status = EXCLUDED.status`,
        [out.outing_id, out.roll_number, out.from_date, out.to_date, out.purpose, phone, out.date, out.time, out.status]
      );
      const bId = out.block_id || 'SAB_B_03';
      await query(
        `INSERT INTO hostel_outing (block_id, outing_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [bId, out.outing_id]
      );
    } catch (e) {
      console.warn("syncSeedData outing error:", e.message);
    }
  }
}

async function ensureDatabaseSchema() {
  try {
    const check = await query("SELECT to_regclass('public.student') AS exists");
    if (!check.rows[0]?.exists) {
      console.log("[DB Migration] No existing tables detected. Initializing schema from database.sql...");
      const sqlPath = path.join(__dirname, "database.sql");
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, "utf8");
        await query(sql);
        console.log("[DB Migration] Database schema initialized successfully!");
      }
    }
  } catch (err) {
    console.warn("[DB Notice] Auto-schema verification notice:", err.message);
  }
}

app.listen(port, () => {
  console.log(`Hostellers API running on http://localhost:${port}`);
  ensureDatabaseSchema()
    .then(() => {
      syncFallbackStudents().catch(() => {});
      syncAllHostels().catch(() => {});
      syncSeedData().then(() => cleanupResolvedComplaints()).catch(() => {});
    })
    .catch(() => {});
  setInterval(() => cleanupResolvedComplaints().catch(() => {}), 60 * 60 * 1000);
});
