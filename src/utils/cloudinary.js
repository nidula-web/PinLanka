/**
 * Cloudinary Image Optimization Helper
 * Injects transformation parameters immediately after '/upload/' for Cloudinary URLs.
 * If the URL is not a Cloudinary URL, returns the original URL untouched.
 * If url is null/undefined/invalid, returns a safe fallback placeholder.
 */
export const getOptimizedImageUrl = (url, type) => {
  if (!url || typeof url !== 'string') return 'https://via.placeholder.com/400x300?text=No+Image';
  if (!url.includes('cloudinary.com') || !url.includes('/upload/')) return url;

  const transformations = {
    pin: 'w_100,h_100,c_fill,q_auto,f_auto',
    thumbnail: 'w_400,h_300,c_fill,q_auto,f_auto',
    full: 'w_1200,c_limit,q_auto,f_auto',
  };
  const transform = transformations[type] || 'q_auto,f_auto';

  // Prevent duplicate transformations
  if (url.includes(`/upload/${transform}/`)) return url;

  return url.replace('/upload/', `/upload/${transform}/`);
};

export default getOptimizedImageUrl;
