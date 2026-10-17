import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/cloudinary';

export default function ImageCarousel({ images = [] }) {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-video bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-gray-400 text-sm font-semibold">No images</span>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  return (
    <div className="relative w-full mb-4">
      {/* Image */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-200 shadow-xs">
        <img
          src={getOptimizedImageUrl(images[current], 'full')}
          alt={`Listing image ${current + 1}`}
          className="w-full aspect-video object-cover bg-gray-200 transition-opacity duration-200"
        />

        {/* Counter badge */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {current + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
          >
            <ChevronRight size={18} className="text-gray-700" />
          </button>
        </>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === current ? 'bg-gray-800' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
