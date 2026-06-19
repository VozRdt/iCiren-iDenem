import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIdeasColumns() {
  const { data, error } = await supabase.from('ideas').select('*').limit(1);
  console.log("Ideas columns:", data && data.length ? Object.keys(data[0]) : "No data", "Error:", error);
}

checkIdeasColumns();
