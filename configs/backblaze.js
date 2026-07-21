import { B2 } from 'b2-sdk-nodejs';
import dotenv from 'dotenv';

dotenv.config();

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY
});

const B2_BUCKET_ID = process.env.B2_BUCKET_ID;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME;

// Función para obtener URL firmada temporal
export const getSignedUrl = async (fileName, expiresIn = 3600) => {
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
