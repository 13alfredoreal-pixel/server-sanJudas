import { createClient } from '@supabase/supabase-js';

/** Bucket privado para PDFs de la biblioteca */
export const PDF_BUCKET = process.env.SUPABASE_PDF_BUCKET || 'biblioteca-pdfs';

let client;

export const isSupabaseConfigured = () =>
  Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

/**
 * Cliente lazy: no crear en import (el SDK actual lanza si la URL está vacía;
 * eso tumba tests y el cold start si falta env).
 */
export const getSupabase = () => {
  if (client) return client;

  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    const error = new Error(
      'Supabase no está configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)',
    );
    error.status = 503;
    throw error;
  }

  client = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
};
