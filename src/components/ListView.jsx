import { useMemo } from 'react';
import { MapPin, Image as ImageIcon, Sparkles } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/cloudinary';
import { isListingPremiumActive } from '../lib/storage';

const CATEGORY_ICONS = {
  real_estate: '🏠',
  vehicles: '🚗',
  electronics: '📱',
  others: '📦',
};

const CATEGORY_NAMES = {
  real_estate: 'Real Estate',
  vehicles: 'Vehicle',
  electronics: 'Electronics',
  others: 'Item',
};

export default function ListView({ listings, onListingClick }) {
  const sortedListings = useMemo(() => {
    return [...listings].sort((a, b) => {
      const aPrem = isListingPremiumActive(a);
      const bPrem = isListingPremiumActive(b);
      if (aPrem === bPrem) return 0;
      return aPrem ? -1 : 1;
    });
  }, [listings]);

  if (listings.length === 0) {
    return (
      <div className="h-full overflow-y-auto px-4 py-16 flex flex-col items-center justify-center text-center bg-gray-50/70">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3 shadow-inner">
          <Sparkles size={28} />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          No listings found
        </h3>
        <p className="text-xs text-gray-500 max-w-xs">
          Try switching categories or clearing price filters to see more properties, vehicles, and items across Sri Lanka.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-5 pb-24 bg-gray-50/70">
      <div className="max-w-7xl mx-auto">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-4 px-0.5">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Showing <span className="text-gray-900">{sortedListings.length}</span>{' '}
            {sortedListings.length === 1 ? 'Listing' : 'Listings'}
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedListings.map((item) => {
            const isPremium = isListingPremiumActive(item);
            const rawImages = item.image_urls || item.imageUrls || (item.imageUrl ? [item.imageUrl] : []);
            const hasImage = rawImages.length > 0;
            const catIcon = CATEGORY_ICONS[item.mainCategory] || '📦';
            const isOwner = item.sellerType === 'owner';

            return (
              <div
                key={item.id}
                onClick={() => onListingClick(item)}
                className={`rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 text-left flex flex-col group cursor-pointer active:scale-[0.99] ${
                  isPremium
                    ? 'bg-yellow-50 border-2 border-yellow-400 shadow-amber-200/50'
                    : 'bg-white border border-gray-200/70 hover:border-gray-300'
                }`}
              >
                {/* Thumbnail Container */}
                <div className="relative w-full aspect-[4/3] bg-gray-200 overflow-hidden">
                  {hasImage ? (
                    <img
                      src={getOptimizedImageUrl(rawImages[0], 'thumbnail')}
                      alt={item.title}
                      loading="lazy"
                      className="w-full aspect-[4/3] object-cover bg-gray-200 group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/400x300?text=Error';
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] flex flex-col items-center justify-center text-gray-400 bg-gray-200">
                      <ImageIcon size={32} />
                      <span className="text-[10px] font-semibold mt-1">No photos</span>
                    </div>
                  )}

                  {/* Badges on image */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    {isPremium && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 flex items-center gap-1 border border-yellow-300">
                        ⭐ Premium
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-md flex items-center gap-1 ${
                        isOwner
                          ? 'bg-emerald-600/90 text-white'
                          : 'bg-blue-600/90 text-white'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOwner ? 'bg-emerald-200' : 'bg-blue-200'
                        }`}
                      />
                      <span className="capitalize">{item.sellerType || 'owner'}</span>
                      {item.sellerType === 'broker' && item.isVerified && (
                        <span title="Verified Broker" className="text-white text-[10px]">🛡️</span>
                      )}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <span>{catIcon}</span>
                      <span className="capitalize text-[10px]">
                        {CATEGORY_NAMES[item.mainCategory] || 'Item'}
                      </span>
                    </span>
                  </div>

                  {rawImages.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                      +{rawImages.length - 1} photos
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Price & PriceTag */}
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-lg font-black text-gray-950 tracking-tight flex items-center gap-1">
                        {isPremium && <span className="text-amber-500 text-sm">⭐</span>}
                        <span>Rs {item.price?.toLocaleString()}</span>
                      </span>
                      {item.priceTag && (
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">
                          Rs {item.priceTag}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-1 mt-1 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h4>

                    {/* Location */}
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                      <MapPin size={12} className="shrink-0 text-gray-400" />
                      <span className="truncate">{item.locationName}</span>
                    </p>
                  </div>

                  {/* Dynamic Category Specs Pill */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                    {item.mainCategory === 'vehicles' && (
                      <>
                        {item.year && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                            {item.year}
                          </span>
                        )}
                        {item.mileage && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600">
                            {item.mileage}
                          </span>
                        )}
                        {item.transmission && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600">
                            {item.transmission}
                          </span>
                        )}
                      </>
                    )}

                    {item.mainCategory === 'real_estate' && (
                      <>
                        {item.propertyType && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 capitalize">
                            {item.propertyType}
                          </span>
                        )}
                        {item.size && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700">
                            {item.size}
                          </span>
                        )}
                      </>
                    )}

                    {(item.mainCategory === 'electronics' ||
                      item.mainCategory === 'others') && (
                      <>
                        {item.condition && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700">
                            {item.condition}
                          </span>
                        )}
                        {item.brand && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600 truncate max-w-[120px]">
                            {item.brand}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
