import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePdfSource, isSupabasePdfPath } from './pdf-storage.js';

test('isSupabasePdfPath accepts bucket objects under pdfs/', () => {
  assert.equal(isSupabasePdfPath('pdfs/libro_1730000000000.pdf'), true);
  assert.equal(isSupabasePdfPath('pdfs/_lgebra_elemental_1.pdf'), true);
  assert.equal(isSupabasePdfPath('biblioteca/raw/abc'), false);
});

test('resolvePdfSource prefers http pdfUrl', () => {
  const source = resolvePdfSource({
    pdfUrl: 'https://res.cloudinary.com/demo/raw/upload/old.pdf',
    pdfPublicId: 'pdfs/nuevo_1.pdf',
  });
  assert.equal(source.kind, 'http');
});

test('resolvePdfSource uses supabase path', () => {
  const source = resolvePdfSource({
    pdfUrl: '',
    pdfPublicId: 'pdfs/plan_de_trabajo_in4_1784778196128.pdf',
  });
  assert.deepEqual(source, {
    kind: 'supabase',
    path: 'pdfs/plan_de_trabajo_in4_1784778196128.pdf',
  });
});

test('resolvePdfSource falls back to Cloudinary raw URL', () => {
  const prev = process.env.CLOUDINARY_CLOUD_NAME;
  process.env.CLOUDINARY_CLOUD_NAME = 'demo-cloud';
  const source = resolvePdfSource({ pdfUrl: '', pdfPublicId: 'biblioteca/libros/abc' });
  process.env.CLOUDINARY_CLOUD_NAME = prev;
  assert.equal(source.kind, 'http');
  assert.equal(
    source.url,
    'https://res.cloudinary.com/demo-cloud/raw/upload/biblioteca/libros/abc',
  );
});
