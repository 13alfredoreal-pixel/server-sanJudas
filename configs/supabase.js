import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.warn('[Supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configurados');
}

export const supabase = createClient(url || '', serviceRoleKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/** Bucket privado para PDFs de la biblioteca */
export const PDF_BUCKET = process.env.SUPABASE_PDF_BUCKET || 'biblioteca-pdfs';
