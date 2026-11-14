import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/database.types';
import { ensureLocalAdmin, isLocalSupabase } from '../src/lib/admin/local-admin';

/** `pnpm admin:local <email>`: מנהל לתור המקומי. מסרב לרוץ מול הענן. */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.argv[2];

if (!url || !secret) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
if (!isLocalSupabase(url)) {
  console.error('Refusing: admin:local adds an admin only to the local Supabase. In the cloud, Gal approves the SQL himself.');
  process.exit(1);
}
if (!email || !email.includes('@')) {
  console.error('Usage: pnpm admin:local <email>');
  process.exit(1);
}

const db = createClient<Database>(url, secret, { auth: { persistSession: false } });
ensureLocalAdmin(db, email).then(
  (id) => console.log(`admin: ${email} (${id})`),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
