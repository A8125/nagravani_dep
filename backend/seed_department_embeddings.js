// ─────────────────────────────────────────────────────────
//  seed_department_embeddings.js
//  Run ONCE after migration_001_pgvector.sql to populate
//  department_embeddings for semantic routing.
//
//  Usage:
//    node seed_department_embeddings.js
//
//  Prereqs:
//    • Ollama running locally with nomic-embed-text model
//    • DATABASE_URL set in .env
//    • departments table populated with at least the 5 Mandya depts
// ─────────────────────────────────────────────────────────

import 'dotenv/config';
import { query, pool } from './db.js';
import { embed, toVectorLiteral } from './embeddings.js';

// ── Department descriptions for embedding ────────────────
// Multiple label phrases per department → better coverage
const DEPARTMENT_LABELS = {
  PWD: [
    'Road damage pothole broken road surface',
    'Bridge repair construction road maintenance',
    'Footpath pavement sidewalk damaged',
    'Road flooding waterlogged street damage',
    'Stray cattle on road traffic hazard',
  ],
  CESC: [
    'Power outage electricity cut no power',
    'Street light not working dark road lamp post',
    'Electrical wire fallen dangerous live wire',
    'Transformer fault power fluctuation',
    'Electric pole damaged broken streetlight',
  ],
  CMC: [
    'Water supply problem no water pipe burst',
    'Sewage overflow drain blocked manhole',
    'Garbage not collected waste pile dump',
    'Drainage flooding dirty water stagnant',
    'Water tank empty supply cut',
  ],
  MUDA: [
    'Illegal construction building encroachment',
    'Building plan approval violation',
    'Unauthorized structure commercial zoning',
    'Land encroachment boundary dispute',
    'Road widening construction blocking',
  ],
  DHO: [
    'Mosquito breeding dengue malaria stagnant water',
    'Hospital public health facility issue',
    'Food adulteration unsafe food vendor',
    'Animal carcass dead animal disposal',
    'Epidemic disease outbreak public health',
  ],
};

async function seedDepartmentEmbeddings() {
  console.log('🔍 Fetching departments from database...');
  const { rows: depts } = await query('SELECT id, short, name FROM departments');

  if (depts.length === 0) {
    console.error('❌ No departments found! Run your departments seed first.');
    process.exit(1);
  }

  const deptMap = Object.fromEntries(depts.map(d => [d.short, d]));
  console.log(`✅ Found ${depts.length} departments: ${depts.map(d => d.short).join(', ')}`);

  let inserted = 0;
  let skipped  = 0;

  for (const [short, labels] of Object.entries(DEPARTMENT_LABELS)) {
    const dept = deptMap[short];
    if (!dept) {
      console.warn(`⚠️  Department '${short}' not found in DB, skipping`);
      skipped++;
      continue;
    }

    console.log(`\n📌 Embedding labels for ${short} (${dept.name})...`);

    for (const label of labels) {
      try {
        const embedding = await embed(label);
        const vectorLiteral = toVectorLiteral(embedding);

        await query(`
          INSERT INTO department_embeddings (department_id, label, embedding)
          VALUES ($1, $2, $3::vector)
          ON CONFLICT (department_id, label) DO UPDATE SET embedding = EXCLUDED.embedding
        `, [dept.id, label, vectorLiteral]);

        console.log(`   ✓ "${label.slice(0, 50)}..."`);
        inserted++;
      } catch (err) {
        console.error(`   ✗ Failed for "${label}":`, err.message);
      }
    }
  }

  console.log(`\n🎉 Done! ${inserted} embeddings inserted/updated, ${skipped} departments skipped.`);
  console.log('\nTest routing with:');
  console.log('  SELECT * FROM route_to_department(\'[...768 floats...]\');');
}

seedDepartmentEmbeddings()
  .catch(err => { console.error('Fatal:', err); process.exit(1); })
  .finally(() => pool.end());
