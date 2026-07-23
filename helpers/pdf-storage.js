import { supabase, PDF_BUCKET } from '../configs/supabase.js';

const isHttpUrl = (value = '') => /^https?:\/\//i.test(value);

/**
 * Sube un PDF (Buffer) al bucket privado.
 * @returns {{ path: string }}
 */
export const uploadPdfBuffer = async (buffer, objectPath, contentType = 'application/pdf') => {
  const { data, error } = await supabase.storage.from(PDF_BUCKET).upload(objectPath, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Supabase PDF upload failed: ${error.message}`);
  }

  return { path: data.path };
};

export const removePdfObject = async (objectPath) => {
  if (!objectPath || isHttpUrl(objectPath)) return;
  const { error } = await supabase.storage.from(PDF_BUCKET).remove([objectPath]);
  if (error) {
    console.log(`[Supabase] Could not delete PDF: ${error.message}`);
  }
};

export const createPdfSignedUrl = async (objectPath, expiresInSeconds = 3600) => {
  const { data, error } = await supabase.storage
    .from(PDF_BUCKET)
    .createSignedUrl(objectPath, expiresInSeconds);

  if (error) {
    throw new Error(`Supabase signed URL failed: ${error.message}`);
  }

  return data.signedUrl;
};

/**
 * Obtiene un Readable/Blob del PDF desde Supabase (o null si no aplica).
 */
export const downloadPdfObject = async (objectPath) => {
  const { data, error } = await supabase.storage.from(PDF_BUCKET).download(objectPath);
  if (error) {
    throw new Error(`Supabase PDF download failed: ${error.message}`);
  }
  return data;
};

/**
 * Resuelve de dónde leer el PDF de un libro.
 *
 * Dual-path (transición):
 * 1. `kind: 'http'` — legacy: `pdfUrl` es URL Cloudinary/HTTP absoluta.
 * 2. `kind: 'supabase'` — actual: `pdfPublicId` es path en bucket (`pdfs/...pdf`).
 * 3. `kind: 'none'` — sin archivo usable.
 *
 * Libros nuevos solo usan Supabase (`pdfUrl` vacío). No borrar el branch HTTP
 * mientras existan documentos legacy en Mongo.
 */
export const resolvePdfSource = (book) => {
  if (isHttpUrl(book.pdfUrl)) {
    return { kind: 'http', url: book.pdfUrl };
  }
  if (book.pdfPublicId && !isHttpUrl(book.pdfPublicId)) {
    return { kind: 'supabase', path: book.pdfPublicId };
  }
  return { kind: 'none' };
};
