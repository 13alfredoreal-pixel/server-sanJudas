import { B2 } from 'b2-sdk-nodejs';
import dotenv from 'dotenv';

dotenv.config();

let b2 = null;
let B2_BUCKET_ID = null;
let B2_BUCKET_NAME = null;

try {
  if (process.env.B2_KEY_ID && process.env.B2_APPLICATION_KEY) {
    b2 = new B2({
      applicationKeyId: process.env.B2_KEY_ID,
      applicationKey: process.env.B2_APPLICATION_KEY
    });
    B2_BUCKET_ID = process.env.B2_BUCKET_ID;
    B2_BUCKET_NAME = process.env.B2_BUCKET_NAME;
    console.log('[Backblaze B2] Initialized successfully');
  } else {
    console.warn('[Backblaze B2] Missing credentials, PDF upload will be disabled');
  }
} catch (error) {
  console.error('[Backblaze B2] Initialization error:', error.message);
}

// Función para obtener URL firmada temporal
export const getSignedUrl = async (fileName, expiresIn = 3600) => {
  if (!b2) {
    throw new Error('Backblaze B2 not initialized');
  }
  try {
    const authResponse = await b2.authorize();
    const downloadUrl = authResponse.data.downloadUrl;
    const bucketName = B2_BUCKET_NAME;
    
    // Generar URL firmada con expiración
    const signedUrl = `${downloadUrl}/file/${bucketName}/${fileName}`;
    
    return signedUrl;
  } catch (error) {
    console.error('[B2 Signed URL Error]', error);
    throw error;
  }
};

export { b2, B2_BUCKET_ID, B2_BUCKET_NAME };
