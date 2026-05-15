// ─────────────────────────────────────────────────────────
//  routes/departments.js  (pgvector edition — uses db.js)
// ─────────────────────────────────────────────────────────

import { Router } from 'express';
import { query }  from '../db.js';

const router = Router();

const OFFICIAL_DEPARTMENTS = [
  {
    short: 'CMC',
    name: 'Mandya City Municipal Council',
    scope: 'Garbage, sewage, noise control, encroachment coordination, and municipal governance',
  },
  {
    short: 'CESC',
    name: 'Chamundeshwari Electricity Supply Corporation',
    scope: 'Street lights, power infrastructure, and electrical maintenance',
  },
  {
    short: 'PWD',
    name: 'Public Works Department, Mandya',
    scope: 'Road infrastructure, repairs, and public works assets',
  },
  {
    short: 'KUWS&DB',
    name: 'Karnataka Urban Water Supply & Drainage Board',
    scope: 'Urban water supply, distribution, and drainage services',
    officer_name: 'Water Supply Division',
  },
  {
    short: 'MUDA',
    name: 'Mandya Urban Development Authority',
    scope: 'Urban planning, zoning, and encroachment oversight',
  },
  {
    short: 'DHO',
    name: 'District Health Office, Mandya',
    scope: 'Public health, sanitation, and health-related complaints',
  },
];

function normalizeDepartments(rows) {
  const existingByShort = new Map(rows.map((row) => [row.short, row]));
  const cmc = existingByShort.get('CMC');

  return OFFICIAL_DEPARTMENTS.map((official) => {
    const base = existingByShort.get(official.short);

    if (base) {
      return {
        ...base,
        name: official.name,
        scope: official.scope,
        officer_name: official.officer_name || base.officer_name,
      };
    }

    if (official.short === 'KUWS&DB' && cmc) {
      return {
        ...cmc,
        id: 'kuwsdb-mandya',
        short: official.short,
        name: official.name,
        scope: official.scope,
        officer_name: official.officer_name,
        active_complaints: 0,
      };
    }

    return {
      id: official.short.toLowerCase(),
      short: official.short,
      name: official.name,
      scope: official.scope,
      officer_name: official.officer_name || 'Nodal Officer',
      officer_phone: '',
      office_address: '',
      lat: null,
      lng: null,
      active_complaints: 0,
    };
  });
}

router.get('/', async (_req, res) => {
  try {
    const { rows: depts } = await query('SELECT * FROM departments ORDER BY name');
    const formatted = normalizeDepartments(depts);

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const { rows } = await query(`
      WITH department_map AS (
        SELECT * FROM (
          VALUES
            ('CMC', 'Mandya City Municipal Council'),
            ('PWD', 'Public Works Department, Mandya'),
            ('CESC', 'Chamundeshwari Electricity Supply Corporation'),
            ('KUWS&DB', 'Karnataka Urban Water Supply & Drainage Board'),
            ('DHO', 'District Health Office, Mandya'),
            ('MUDA', 'Mandya Urban Development Authority')
        ) AS dm(department, name)
      ),
      problem_department_map AS (
        SELECT p.id, p.status, mapped.department
        FROM problems p
        JOIN LATERAL (
          VALUES
            ('CMC', p.category IN ('garbage', 'sewage', 'noise', 'encroachment')),
            ('PWD', p.category = 'road'),
            ('CESC', p.category = 'streetlight'),
            ('KUWS&DB', p.category = 'water'),
            ('DHO', p.category = 'health'),
            ('MUDA', p.category = 'encroachment')
        ) AS mapped(department, matches) ON mapped.matches
      ),
      aggregated AS (
        SELECT
          department,
          COUNT(*) FILTER (WHERE status != 'resolved')::int AS open_cases,
          COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved_cases,
          COUNT(*)::int AS total_cases
        FROM problem_department_map
        GROUP BY department
      )
      SELECT
        dm.department,
        dm.name,
        COALESCE(a.open_cases, 0) AS open_cases,
        COALESCE(a.resolved_cases, 0) AS resolved_cases,
        COALESCE(a.total_cases, 0) AS total_cases
      FROM department_map dm
      LEFT JOIN aggregated a ON a.department = dm.department
      ORDER BY dm.department
    `);

    res.json({ success: true, data: rows });
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

    const normalized = normalizeDepartments(deptRows)[0];

    const { rows: active } = await query(`
      SELECT * FROM complaints
      WHERE department_id = $1 AND status IN ('pending', 'inProgress')
      ORDER BY "createdAt" DESC
      LIMIT 20
    `, [req.params.id]);

    res.json({ success: true, data: { ...normalized, active_complaints: active } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
