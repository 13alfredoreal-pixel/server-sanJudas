import cloudinary from '../configs/cloudinary.js';

/**
 * Elimina una imagen de Cloudinary si el flujo (register/update) falla después de subirla.
 */
export const destroyUploadedImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    console.log(`[Cloudinary] Orphan cleaned: ${publicId}`);
  } catch (error) {
    console.error(`[Cloudinary] Failed to clean orphan ${publicId}:`, error.message);
  }
};
