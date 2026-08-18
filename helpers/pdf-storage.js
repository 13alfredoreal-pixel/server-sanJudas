import { getSupabase, PDF_BUCKET } from '../configs/supabase.js';

const isHttpUrl = (value = '') => /^https?:\/\//i.test(value);

/** Paths generados por el API: `pdfs/{safeTitle}_{timestamp}.pdf` */
export const PDF_OBJECT_PATH_RE = /^pdfs\/[a-z0-9_]+_\d+\.pdf$/i;

/** Cualquier objeto PDF bajo `pdfs/` (incluye nombres legacy). */
export const isSupabasePdfPath = (value = '') => /^pdfs\/[^\s]+\.pdf$/i.test(String(value).trim());

const cloudinaryRawUrl = (publicId) => {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloud || !publicId) return '';
  const id = String(publicId).replace(/^\/+/, '');
  return `https://res.cloudinary.com/${cloud}/raw/upload/${id}`;
};

export class PdfStorageError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'PdfStorageError';
    this.status = status;
  }
}

/**
 * Construye un path de objeto en el bucket (solo server; no confiar en path del client).
 */
export const buildPdfObjectPath = (title = 'libro') => {
  const timestamp = Date.now();
  const safeName =
    String(title)
      .replace(/[^a-z0-9]+/gi, '_')
      .toLowerCase() || 'libro';
  return `pdfs/${safeName}_${timestamp}.pdf`;
};

/**
 * Sube un PDF (Buffer) al bucket privado.
 * Uso legacy / local: el body pasa por el API (límite ~4.5 MB en Vercel).
 * @returns {{ path: string }}
 */
export const uploadPdfBuffer = async (buffer, objectPath, contentType = 'application/pdf') => {
  const { data, error } = await getSupabase().storage.from(PDF_BUCKET).upload(objectPath, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new PdfStorageError(`Supabase PDF upload failed: ${error.message}`, 502);
  }

  return { path: data.path };
};

/**
 * URL firmada para que el client suba el PDF directo a Supabase (válida ~2 h).
 * @returns {{ path: string, signedUrl: string, token: string, expiresIn: number }}
 */
export const createPdfSignedUploadUrl = async (objectPath) => {
  const { data, error } = await getSupabase()
    .storage.from(PDF_BUCKET)
    .createSignedUploadUrl(objectPath);

  if (error) {
    throw new PdfStorageError(`Supabase signed upload URL failed: ${error.message}`, 502);
  }

  return {
    path: data.path,
    signedUrl: data.signedUrl,
    token: data.token,
    expiresIn: 7200,
  };
};

/**
 * Comprueba si un path ya existe en el bucket (p. ej. tras signed upload del client).
 */
export const pdfObjectExists = async (objectPath) => {
  if (!objectPath || isHttpUrl(objectPath)) return false;
  const { data, error } = await getSupabase()
    .storage.from(PDF_BUCKET)
    .createSignedUrl(objectPath, 60);
  return !error && Boolean(data?.signedUrl);
};

export const removePdfObject = async (objectPath) => {
  if (!objectPath || isHttpUrl(objectPath)) return;
  const { error } = await getSupabase().storage.from(PDF_BUCKET).remove([objectPath]);
  if (error) {
    console.log(`[Supabase] Could not delete PDF: ${error.message}`);
  }
};

export const createPdfSignedUrl = async (objectPath, expiresInSeconds = 3600) => {
  const { data, error } = await getSupabase()
    .storage.from(PDF_BUCKET)
    .createSignedUrl(objectPath, expiresInSeconds);

  if (error) {
    const notFound = /not found|does not exist|not exist/i.test(error.message || '');
    throw new PdfStorageError(`Supabase signed URL failed: ${error.message}`, notFound ? 404 : 502);
  }

  return data.signedUrl;
};

/**
 * Obtiene un Readable/Blob del PDF desde Supabase (o null si no aplica).
 */
export const downloadPdfObject = async (objectPath) => {
  const { data, error } = await getSupabase().storage.from(PDF_BUCKET).download(objectPath);
  if (error) {
    throw new PdfStorageError(`Supabase PDF download failed: ${error.message}`, 502);
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
export const resolvePdfSource = (book = {}) => {
  if (isHttpUrl(book.pdfUrl)) {
    return { kind: 'http', url: book.pdfUrl };
  }
  if (isHttpUrl(book.pdfPublicId)) {
    return { kind: 'http', url: book.pdfPublicId };
  }
  if (isSupabasePdfPath(book.pdfPublicId)) {
    return { kind: 'supabase', path: String(book.pdfPublicId).trim() };
  }
  if (book.pdfPublicId) {
    const url = cloudinaryRawUrl(book.pdfPublicId);
    if (url) return { kind: 'http', url };
  }
  return { kind: 'none' };
};

const STORAGE_HINT =
  'En Vercel: SUPABASE_URL = Project URL (https://xxxx.supabase.co, debe resolver DNS), SUPABASE_SERVICE_ROLE_KEY = JWT service_role (eyJ...) o sb_secret_ completo, bucket privado biblioteca-pdfs. Luego Redeploy.';

export const storageFailureHint = (errorMessage = '') => {
  if (/fetch failed|ENOTFOUND|getaddrinfo|Could not resolve/i.test(errorMessage)) {
    return `Supabase no es alcanzable (${errorMessage}). ${STORAGE_HINT}`;
  }
  return `${STORAGE_HINT}`;
};

/** Diagnóstico admin: sin secretos. */
export const inspectPdfStorage = async () => {
  const url = process.env.SUPABASE_URL?.trim() || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  let host = '';
  try {
    host = new URL(url).host;
  } catch {
    /* URL inválida */
  }

  const keyKind =
    key.startsWith('eyJ') && key.split('.').length === 3
      ? 'jwt'
      : key.startsWith('sb_secret_')
        ? 'sb_secret'
        : key.startsWith('sb_publishable_')
          ? 'sb_publishable'
          : key
            ? 'unknown'
            : 'missing';

  const report = {
    ok: false,
    urlHost: host || null,
    urlLooksValid: Boolean(host && host.endsWith('.supabase.co')),
    keyKind,
    keyLength: key.length,
    bucket: PDF_BUCKET,
    buckets: null,
    bucketExists: false,
    listBucketsError: null,
    hint: STORAGE_HINT,
  };

  if (!url || !key) {
    report.hint = 'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno de Vercel.';
    return report;
  }

  try {
    const { data, error } = await getSupabase().storage.listBuckets();
    if (error) {
      report.listBucketsError = error.message;
      report.hint = storageFailureHint(error.message);
      return report;
    }
    report.buckets = (data || []).map((b) => b.name);
    report.bucketExists = report.buckets.includes(PDF_BUCKET);
    report.ok = report.bucketExists;
    if (!report.bucketExists) {
      report.hint = `Crea el bucket privado "${PDF_BUCKET}" en Supabase → Storage.`;
    }
  } catch (error) {
    report.listBucketsError = error.message;
    report.hint = storageFailureHint(error.message);
  }

  return report;
};
