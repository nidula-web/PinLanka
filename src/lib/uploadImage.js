import { supabase, isSupabaseConfigured } from './supabase';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Converts a File object to a Base64 data URI for safe local fallback.
 */
function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Fallback uploader: uploads to Supabase Storage if configured, or base64 data URL.
 */
async function fallbackUpload(file) {
  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = (file.name && file.name.split('.').pop()) || 'jpg';
      const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${cleanExt || 'jpg'}`;
      const filePath = `uploads/${uniqueName}`;

      const { data, error } = await supabase.storage
        .from('listing-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg',
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('listing-images')
          .getPublicUrl(data.path || filePath);
        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Fallback storage upload notice:', err);
    }
  }

  return fileToBase64(file);
}

/**
 * Upload a single image to Cloudinary (unsigned).
 * Posts to: https://api.cloudinary.com/v1_1/${VITE_CLOUDINARY_CLOUD_NAME}/image/upload
 * with FormData 'file' and 'upload_preset'.
 *
 * @param {File} file - The file to upload
 * @returns {Promise<string>} The secure_url from Cloudinary
 */
export async function uploadImage(file) {
  if (!file) return '';
  if (typeof file === 'string') return file;

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || CLOUD_NAME || 'w5ttoxqb';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || UPLOAD_PRESET || 'ml_defaultPinLanka';

  if (cloudName && uploadPreset) {
    try {
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary upload error:', errorText);
        throw new Error(`Cloudinary upload failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      if (data?.secure_url) {
        return data.secure_url;
      }
    } catch (err) {
      console.warn('Cloudinary upload failed, using fallback:', err);
      return fallbackUpload(file);
    }
  }

  // If Cloudinary keys are not yet configured in .env, use graceful fallback
  console.info('Cloudinary credentials not detected in .env; using storage fallback.');
  return fallbackUpload(file);
}

/**
 * Upload multiple images in parallel.
 *
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<string[]>} Array of image URLs
 */
export async function uploadImages(files) {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map((file) => uploadImage(file)));
}

export default uploadImage;
