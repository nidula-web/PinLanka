import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const MAIN_CATEGORIES = [
  { key: 'all', label: 'All', icon: '✨' },
  { key: 'real_estate', label: 'Real Estate', icon: '🏠' },
  { key: 'vehicles', label: 'Vehicles', icon: '🚗' },
  { key: 'electronics', label: 'Electronics', icon: '📱' },
  { key: 'others', label: 'Others', icon: '📦' },
];

const SUB_CATEGORIES = {
  real_estate: [
    { key: 'all', label: 'All Properties' },
    { key: 'land', label: 'Land' },
    { key: 'house', label: 'House' },
    { key: 'apartment', label: 'Apartment' },
    { key: 'commercial', label: 'Commercial' },
  ],
  vehicles: [
    { key: 'all', label: 'All Vehicles' },
    { key: 'car', label: 'Cars' },
    { key: 'bike', label: 'Bikes' },
    { key: 'van', label: 'Vans' },
    { key: 'tuk', label: 'Three Wheelers' },
  ],
};

export default function FilterBar({
  activeCategory = 'all',
  onCategoryChange,
  activeSubCategory = 'all',
  onSubCategoryChange,
  priceRange,
  onPriceRangeChange,
}) {
  const [showPrice, setShowPrice] = useState(false);

  const subOptions = SUB_CATEGORIES[activeCategory] || null;
  const hasPriceFilter = Boolean(priceRange?.min || priceRange?.max);

  return (
    <div className="w-full">
      {/* Category Pills & Price Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
        {MAIN_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => {
                onCategoryChange(cat.key);
                if (onSubCategoryChange) onSubCategoryChange('all');
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-gray-900 text-white shadow-sm ring-1 ring-gray-900'
                  : 'bg-gray-100/90 text-gray-600 hover:bg-gray-200/90 hover:text-gray-900'
              }`}
            >
              <span className="text-xs">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}

        {/* Price filter toggle button */}
        <button
          onClick={() => setShowPrice(!showPrice)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1 shrink-0 ml-auto active:scale-95 ${
            hasPriceFilter || showPrice
              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
              : 'bg-gray-100/90 text-gray-600 hover:bg-gray-200/90 hover:text-gray-900'
          }`}
        >
          <SlidersHorizontal size={13} />
          <span>Price</span>
          {hasPriceFilter && (
            <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />
          )}
        </button>
      </div>

      {/* Subcategory row (shown when Real Estate or Vehicles is active) */}
      {subOptions && (
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pt-2 pb-0.5 text-[11px]">
          {subOptions.map((sub) => {
            const isSubActive = activeSubCategory === sub.key;
            return (
              <button
                key={sub.key}
                onClick={() => onSubCategoryChange(sub.key)}
                className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-all duration-150 shrink-0 ${
                  isSubActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/60'
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Dropdown Price Filter */}
      {showPrice && (
        <div className="pt-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-2.5 flex items-center gap-2 max-w-sm">
            <input
              type="number"
              placeholder="Min Rs"
              value={priceRange.min}
              onChange={(e) =>
                onPriceRangeChange({ ...priceRange, min: e.target.value })
              }
              className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
            <span className="text-gray-300 text-xs font-semibold">–</span>
            <input
              type="number"
              placeholder="Max Rs"
              value={priceRange.max}
              onChange={(e) =>
                onPriceRangeChange({ ...priceRange, max: e.target.value })
              }
              className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
            {hasPriceFilter && (
              <button
                onClick={() => onPriceRangeChange({ min: '', max: '' })}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                title="Clear"
              >
                <X size={14} />
              </button>
            )}
            <button
              onClick={() => setShowPrice(false)}
              className="px-2.5 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
