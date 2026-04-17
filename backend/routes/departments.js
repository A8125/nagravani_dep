// ─────────────────────────────────────────────────────────
//  routes/departments.js  (pgvector edition — uses db.js)
// ─────────────────────────────────────────────────────────

import { Router } from 'express';
import { query }  from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { rows: depts } = await query('SELECT * FROM departments ORDER BY name');

    const { rows: counts } = await query(`
      SELECT department_id,
             COUNT(*) FILTER (WHERE status IN ('Pending','InProgress')) AS active
      FROM complaints
      GROUP BY department_id
    `);

    const countMap = Object.fromEntries(counts.map(r => [r.department_id, parseInt(r.active)]));

    const formatted = depts.map(d => ({
      ...d,
      active_complaints: countMap[d.id] ?? 0,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows: deptRows } = await query(
      'SELECT * FROM departments WHERE id = $1', [req.params.id]
    );
    if (!deptRows[0]) return res.status(404).json({ error: 'Not found' });

    const { rows: active } = await query(`
      SELECT * FROM complaints
      WHERE department_id = $1 AND status IN ('pending', 'inProgress')
      ORDER BY "createdAt" DESC
      LIMIT 20
    `, [req.params.id]);

    res.json({ success: true, data: { ...deptRows[0], active_complaints: active } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
