import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Requires service role or anon if RLS disabled

const supabase = createClient(supabaseUrl, supabaseKey);

const departments = [
  {
    name: 'Mandya City Municipal Council',
    short: 'CMC',
    scope: 'City administration, sanitation, and municipal governance',
    officer_name: 'CMC Commissioner',
    officer_phone: '08232-224004',
    office_address: 'M C Road, Mandya, Karnataka 571401',
    lat: 12.5218, lng: 76.8951
  },
  {
    name: 'Chamundeshwari Electricity Supply Corp (Mandya)',
    short: 'CESC',
    scope: 'Power supply, street lights, and electrical maintenance',
    officer_name: 'Superintending Engineer',
    officer_phone: '1912',
    office_address: 'O&M Circle, CESC, Mandya - 571401',
    lat: 12.5200, lng: 76.8920
  },
  {
    name: 'Public Works Department Mandya',
    short: 'PWD',
    scope: 'Major roads, highway infrastructure, and public buildings',
    officer_name: 'Executive Engineer',
    officer_phone: '08232-225100',
    office_address: 'PWD Office, Mandya District',
    lat: 12.5230, lng: 76.8970
  },
  {
    name: 'Mandya Urban Development Authority',
    short: 'MUDA',
    scope: 'Urban planning, layout development, and zoning',
    officer_name: 'MUDA Commissioner',
    officer_phone: '08232-224600',
    office_address: 'Deputy Commissioner Office Complex, Mandya',
    lat: 12.5180, lng: 76.8900
  },
  {
    name: 'District Health & Family Welfare',
    short: 'DHO',
    scope: 'Public health, disease control, and government hospitals',
    officer_name: 'District Health Officer',
    officer_phone: '104',
    office_address: 'District Hospital Campus, Mandya',
    lat: 12.5250, lng: 76.8990
  }
];

async function seed() {
  console.log('Clearing existing departments...');
  await supabase.from('complaints').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('departments').delete().neq('short', 'NONEXISTENT');
  
  console.log('Inserting real Mandya departments...');
  const { data, error } = await supabase.from('departments').insert(departments).select();
  
  if (error) {
    console.error('Error seeding departments:', error);
  } else {
    console.log('Seeded departments:', data?.length);
  }
}

seed();
