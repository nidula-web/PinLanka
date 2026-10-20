import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/cloudinary';

export default function ImageCarousel({ images = [] }) {
  const [current, setCurrent] = useState(0);

  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];

  if (safeImages.length === 0) {
    return (
      <div className="w-full aspect-video bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-gray-400 text-sm font-semibold">No images</span>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c === 0 ? safeImages.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === safeImages.length - 1 ? 0 : c + 1));

  const currentImageUrl = getOptimizedImageUrl(safeImages[current] || safeImages[0], 'full');

  return (
    <div className="relative w-full mb-4">
      {/* Main Image */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-200 shadow-xs">
        <img
          src={currentImageUrl}
          alt={`Listing image ${current + 1}`}
          className="w-full aspect-video object-cover bg-gray-200 transition-opacity duration-200"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/400x300?text=Error';
          }}
        />

        {/* Counter badge */}
        {safeImages.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {current + 1} / {safeImages.length}
          </div>
        )}
      </div>

      {/* Navigation arrows */}
      {safeImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors cursor-pointer"
            title="Previous image"
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors cursor-pointer"
            title="Next image"
          >
            <ChevronRight size={18} className="text-gray-700" />
          </button>
        </>
      )}

      {/* Thumbnail Gallery / Dots */}
      {safeImages.length > 1 && (
        <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1">
          {(safeImages || []).map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                i === current
                  ? 'border-blue-600 ring-2 ring-blue-200 scale-102'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={getOptimizedImageUrl(url, 'thumbnail')}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/100x100?text=Error';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
