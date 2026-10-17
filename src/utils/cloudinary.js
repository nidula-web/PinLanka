/**
 * Cloudinary Image Optimization Helper
 * Injects transformation parameters immediately after '/upload/' for Cloudinary URLs.
 * If the URL is not a Cloudinary URL, returns the original URL unchanged.
 *
 * @param {string} originalUrl - The image URL to optimize
 * @param {'pin' | 'thumbnail' | 'full'} [type='thumbnail'] - The target image size/type
 * @returns {string} The optimized image URL
 */
export function getOptimizedImageUrl(originalUrl, type = 'thumbnail') {
  if (!originalUrl || typeof originalUrl !== 'string') {
    return originalUrl || '';
  }

  // Validate if it is a Cloudinary URL with an /upload/ path
  const isCloudinary =
    originalUrl.includes('cloudinary.com') && originalUrl.includes('/upload/');

  if (!isCloudinary) {
    return originalUrl;
  }

  const transformations = {
    pin: 'w_100,h_100,c_fill,q_auto,f_auto',
    thumbnail: 'w_400,h_300,c_fill,q_auto,f_auto',
    full: 'w_1200,c_limit,q_auto,f_auto',
  };

  const transform = transformations[type] || transformations.thumbnail;

  // Prevent duplicate injection if already present
  if (originalUrl.includes(`/upload/${transform}/`)) {
    return originalUrl;
  }

  // Inject transformation immediately after /upload/
  return originalUrl.replace('/upload/', `/upload/${transform}/`);
}

export default getOptimizedImageUrl;
