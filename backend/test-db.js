// test-db.js - Test database connection to Supabase
import { pool, query, dbHealthCheck } from './db.js';

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test 1: Health check
    const now = await dbHealthCheck();
    console.log('✅ Connected to database! Server time:', now);
    
    // Test 2: Count complaints
    const { rows } = await query('SELECT COUNT(*) FROM complaints');
    console.log('✅ Test query successful! Complaints count:', rows[0].count);
    
    // Test 3: Check pgvector extension
    const { rows: extRows } = await query("SELECT extname FROM pg_extension WHERE extname = 'vector'");
    if (extRows.length > 0) {
      console.log('✅ pgvector extension is enabled');
    } else {
      console.warn('⚠️ pgvector extension is NOT enabled');
    }
    
    console.log('\n🎉 Database connection successful!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
