import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Upload a single image file to Supabase Storage bucket 'listing-images'.
 * If Supabase is unconfigured or storage bucket isn't set up yet,
 * it safely falls back to a base64 Data URL so listings can still be created locally.
 *
 * @param {File} file
 * @returns {Promise<string>} Public URL or Base64 Data URL
 */
export async function uploadImage(file) {
  if (!file) return '';

  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = (file.name && file.name.split('.').pop()) || 'jpg';
      const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${cleanExt || 'jpg'}`;
      const filePath = `listings/${uniqueName}`;

      const { data, error } = await supabase.storage
        .from('listing-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg',
        });

      if (error) {
        console.warn('Supabase Storage upload warning (fallback to base64):', error.message);
        return fileToBase64(file);
      }

      const { data: publicData } = supabase.storage
        .from('listing-images')
        .getPublicUrl(data.path || filePath);

      if (publicData?.publicUrl) {
        return publicData.publicUrl;
      }
    } catch (err) {
      console.warn('Supabase storage upload error, falling back to base64 preview:', err);
      return fileToBase64(file);
    }
  }

  // Fallback for local preview mode
  return fileToBase64(file);
}

/**
 * Upload multiple files to Supabase Storage 'listing-images'.
 *
 * @param {File[]} files
 * @returns {Promise<string[]>} Array of image URLs
 */
export async function uploadImages(files) {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map(uploadImage));
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
