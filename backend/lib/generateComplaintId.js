import { query } from '../db.js';

export async function generateComplaintId(deptShort) {
  // Atomic increment inside a transaction — no race conditions
  const { rows } = await query(`
    INSERT INTO complaint_counters (department_short, number_of_complaints)
    VALUES ($1, 1)
    ON CONFLICT (department_short)
    DO UPDATE SET number_of_complaints = complaint_counters.number_of_complaints + 1
    RETURNING number_of_complaints
  `, [deptShort]);

  const num = rows[0].number_of_complaints;
  return `CMP-${deptShort}-${String(num).padStart(4, '0')}`;
}