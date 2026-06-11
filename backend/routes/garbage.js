import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db.js";

const router = Router();

const GARBAGE_DEPARTMENT_ID = "11e1918e-7c31-4be6-9b2f-374449e4e0ee";
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function normalizeScheduleRow(row) {
  return {
    id: row.id,
    ward: row.ward,
    collection_days: Array.isArray(row.collection_days) ? row.collection_days : [],
    time_slot: row.time_slot,
    vehicle_number: row.vehicle_number,
    updated_at: row.updated_at,
  };
}

function calcPriorityScore(upvoteCount, createdAt) {
  const days = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 86400000,
  );
  return upvoteCount * 10 + days * 2;
}

function buildTimeSlotFromVisitTime(visitTime) {
  if (!visitTime) return "";

  const timeString =
    typeof visitTime === "string"
      ? visitTime
      : visitTime instanceof Date
        ? visitTime.toTimeString().slice(0, 8)
        : String(visitTime);
  const [hourText = "0", minuteText = "00"] = timeString.split(":");
  const hour = Number(hourText);
  const minute = minuteText.slice(0, 2);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  const label = `${String(hour12).padStart(2, "0")}:${minute} ${period}`;

  return `${hour < 12 ? "Morning" : "Evening"} ${label}`;
}

async function fetchTruckNamesById(truckIds) {
  if (truckIds.length === 0) return new Map();

  const { rows } = await query(
    `
    SELECT id::text AS id, name
    FROM garbage_trucks
    WHERE id = ANY($1::uuid[])
    `,
    [truckIds],
  );

  return new Map(rows.map((row) => [row.id, row.name]));
}

async function formatScheduleRows(rawRows) {
  if (rawRows.length === 0) return [];

  const sample = rawRows[0];

  if ("collection_days" in sample && "time_slot" in sample) {
    return rawRows.map(normalizeScheduleRow);
  }

  const truckIds = [
    ...new Set(
      rawRows
        .map((row) => row.truck_id)
        .filter(Boolean),
    ),
  ];
  const truckNameById = await fetchTruckNamesById(truckIds);
  const scheduleByWard = new Map();

  for (const row of rawRows) {
    const ward = row.ward;
    if (!scheduleByWard.has(ward)) {
      scheduleByWard.set(ward, {
        id: String(row.id),
        ward,
        collection_days: [],
        time_slot: buildTimeSlotFromVisitTime(row.visit_time),
        vehicle_number: truckNameById.get(String(row.truck_id)) || String(row.truck_id || ""),
        updated_at: row.updated_at || row.created_at,
      });
    }

    const entry = scheduleByWard.get(ward);
    const dayName = DAY_NAMES[Number(row.day_of_week)];

    if (dayName && !entry.collection_days.includes(dayName)) {
      entry.collection_days.push(dayName);
    }

    if (!entry.time_slot && row.visit_time) {
      entry.time_slot = buildTimeSlotFromVisitTime(row.visit_time);
    }

    const vehicleName = truckNameById.get(String(row.truck_id));
    if (
      vehicleName &&
      !entry.vehicle_number.split(", ").includes(vehicleName)
    ) {
      entry.vehicle_number = entry.vehicle_number
        ? `${entry.vehicle_number}, ${vehicleName}`
        : vehicleName;
    }

    if (row.updated_at || row.created_at) {
      const nextTimestamp = row.updated_at || row.created_at;
      if (!entry.updated_at || new Date(nextTimestamp) > new Date(entry.updated_at)) {
        entry.updated_at = nextTimestamp;
      }
    }
  }

  return Array.from(scheduleByWard.values()).sort((a, b) => a.ward.localeCompare(b.ward));
}

async function getTodayMissedCount(ward) {
  const { rows } = await query(
    `
    SELECT COUNT(*)::int AS count
    FROM garbage_missed_reports
    WHERE ward = $1
      AND reported_date = CURRENT_DATE
    `,
    [ward],
  );

  return rows[0]?.count ?? 0;
}

async function ensureAutoComplaintForToday(ward, count) {
  if (count < 5) return false;

  const { rows: existingRows } = await query(
    `
    SELECT id
    FROM problems
    WHERE category = 'garbage'
      AND ward = $1
      AND DATE("createdAt") = CURRENT_DATE
    LIMIT 1
    `,
    [ward],
  );

  if (existingRows.length > 0) {
    return true;
  }

  const todayLabel = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
  const title = `Garbage collection missed in ${ward}`;
  const summary = `${count} citizens have reported that the garbage collection vehicle did not visit ${ward} today (${todayLabel}).`;
  const createdAt = new Date().toISOString();
  const priorityScore = calcPriorityScore(count, createdAt);

  try {
    await query(
      `
      INSERT INTO problems
        (id, title, category, ward, summary, status, "upvoteCount", "priorityScore", department_id, address, source)
      VALUES
        ($1, $2, 'garbage', $3, $4, 'pending', $5, $6, $7, $3, 'auto')
      `,
      [uuid(), title, ward, summary, count, priorityScore, GARBAGE_DEPARTMENT_ID],
    );
  } catch (err) {
    console.error("[GARBAGE] auto-complaint insert failed:", err);
    return false;
  }

  return true;
}

router.get("/schedules", async (_req, res) => {
  try {
    const { rows } = await query(
      `
      SELECT *
      FROM garbage_schedules
      ORDER BY ward ASC
      `,
    );
    console.log("[GARBAGE] /api/garbage/schedules rows:", rows.length, rows.slice(0, 3));

    const data = await formatScheduleRows(rows);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/schedule/:ward", async (req, res) => {
  try {
    const ward = decodeURIComponent(req.params.ward).trim();
    const { rows } = await query(
      `
      SELECT *
      FROM garbage_schedules
      WHERE ward = $1
      `,
      [ward],
    );
    console.log(`[GARBAGE] /api/garbage/schedule/${ward} rows:`, rows.length, rows.slice(0, 3));

    const data = await formatScheduleRows(rows);

    if (!data[0]) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json({ success: true, data: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/missed/:ward", async (req, res) => {
  try {
    const ward = decodeURIComponent(req.params.ward).trim();
    const count = await getTodayMissedCount(ward);
    res.json({ success: true, ward, date: new Date().toISOString().slice(0, 10), count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/history/:ward", async (req, res) => {
  try {
    const ward = decodeURIComponent(req.params.ward).trim();
    const { rows } = await query(
      `
      SELECT reported_date, COUNT(*)::int as miss_count
      FROM garbage_missed_reports
      WHERE ward = $1
      AND reported_date >= CURRENT_DATE - INTERVAL '28 days'
      GROUP BY reported_date
      ORDER BY reported_date ASC
      `,
      [ward],
    );

    res.json({ success: true, ward, data: rows });
  } catch (err) {
    console.error("[GARBAGE ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/autocomplaint/:ward", async (req, res) => {
  try {
    const ward = decodeURIComponent(req.params.ward).trim();
    const { rows } = await query(
      `
      SELECT id, title, status, created_at
      FROM problems
      WHERE ward = $1
      AND source = 'auto'
      AND category = 'garbage'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [ward],
    );

    res.json({ success: true, ward, data: rows[0] || null });
  } catch (err) {
    console.error("[GARBAGE ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/missed", async (req, res) => {
  try {
    const ward = String(req.body?.ward || "").trim();
    const aadhaarLast4 = String(req.body?.aadhaar_last4 || "").trim();

    if (!ward) {
      return res.status(400).json({ error: "ward is required" });
    }

    if (!/^\d{4}$/.test(aadhaarLast4)) {
      return res.status(400).json({ error: "aadhaar_last4 must be a 4-digit string" });
    }

    const { rows: scheduleRows } = await query(
      `
      SELECT ward
      FROM garbage_schedules gs
      WHERE gs.ward = $1
      LIMIT 1
      `,
      [ward],
    );

    if (!scheduleRows[0]) {
      return res.status(404).json({ error: "Ward schedule not found" });
    }

    await query(
      `
      INSERT INTO garbage_missed_reports (ward, reported_date, aadhaar_last4)
      VALUES ($1, CURRENT_DATE, $2)
      ON CONFLICT (ward, reported_date, aadhaar_last4) DO NOTHING
      `,
      [ward, aadhaarLast4],
    );

    const count = await getTodayMissedCount(ward);
    const autoComplaintRaised = await ensureAutoComplaintForToday(ward, count);

    res.json({
      success: true,
      ward,
      date: new Date().toISOString().slice(0, 10),
      count,
      auto_complaint_raised: autoComplaintRaised,
    });
  } catch (err) {
    console.error("[GARBAGE MISSED ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
