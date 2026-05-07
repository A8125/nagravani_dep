import express from "express";
import { query } from "../db.js";

const router = express.Router();

router.get("/wards", async (_req, res) => {
  try {
    const { rows } = await query(`
      WITH ward_stats AS (
        SELECT
          ward,
          COUNT(*) AS count,
          AVG("priorityScore") AS avg_priority
        FROM problems
        WHERE status != 'resolved'
        GROUP BY ward
      ),
      ranked_categories AS (
        SELECT
          ward,
          category,
          ROW_NUMBER() OVER (
            PARTITION BY ward
            ORDER BY COUNT(*) DESC, category ASC
          ) AS rank
        FROM problems
        WHERE status != 'resolved'
        GROUP BY ward, category
      ),
      ranked_severities AS (
        SELECT
          ward,
          severity,
          ROW_NUMBER() OVER (
            PARTITION BY ward
            ORDER BY COUNT(*) DESC, severity ASC
          ) AS rank
        FROM problems
        WHERE status != 'resolved'
        GROUP BY ward, severity
      )
      SELECT
        ws.ward,
        ws.count::int AS count,
        ROUND(ws.avg_priority::numeric, 1) AS avg_priority,
        rc.category AS top_category,
        rs.severity AS severity
      FROM ward_stats ws
      LEFT JOIN ranked_categories rc
        ON rc.ward = ws.ward
       AND rc.rank = 1
      LEFT JOIN ranked_severities rs
        ON rs.ward = ws.ward
       AND rs.rank = 1
      ORDER BY ws.count DESC, ws.ward ASC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
