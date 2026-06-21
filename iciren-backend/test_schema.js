import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPurchases() {
  const { data: purchases, error: err1 } = await supabase.from('purchases').select('*');
  for (const p of purchases) {
    if (!p.idea_content) {
      const { data: idea } = await supabase.from('ideas').select('content, platform').eq('id', p.idea_id).single();
      if (idea) {
        await supabase.from('purchases').update({ idea_content: idea.content, idea_platform: idea.platform }).eq('id', p.id);
        console.log(`Fixed purchase for idea: ${p.idea_title}`);
      }
    }
  }
  console.log("Done fixing purchases!");
}

fixPurchases();
