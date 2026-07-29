import { Router } from 'express';
import { validateJWT } from '../../middlewares/jwt-verify.js';
import { isAdmin } from '../../middlewares/is-admin.js';
import {
  getBooks,
  getBookById,
  createPdfUploadUrl,
  uploadBook,
  deleteBook,
  getPdfSignedUrl,
  servePdf,
} from './book.controller.js';
import { authenticatedLimiter } from '../../middlewares/request-limit.js';
import { uploadBookFiles } from '../../middlewares/book-multer.js';

const router = Router();

router.get('/', validateJWT, authenticatedLimiter, getBooks);

router.post('/upload-url', validateJWT, authenticatedLimiter, isAdmin, createPdfUploadUrl);

router.get('/:id', validateJWT, authenticatedLimiter, getBookById);

router.post(
  '/',
  validateJWT,
  authenticatedLimiter,
  isAdmin,
  uploadBookFiles.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  uploadBook,
);

router.delete('/:id', validateJWT, authenticatedLimiter, isAdmin, deleteBook);

router.get('/:id/pdf', validateJWT, authenticatedLimiter, servePdf);
router.get('/:id/signed-url', validateJWT, authenticatedLimiter, getPdfSignedUrl);

export default router;
