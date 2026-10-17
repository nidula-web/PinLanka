import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  LayersControl,
} from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';
import MagicSearchBar from './MagicSearchBar';
import { getOptimizedImageUrl } from '../utils/cloudinary';

// --- Fix Leaflet default icon issues in Vite ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CATEGORY_ICONS = {
  real_estate: '🏠',
  vehicles: '🚗',
  electronics: '📱',
  services: '🛠️',
  others: '📦',
};

// --- Price bubble marker factory with category emoji, verified broker badge & Golden Pin ---
function createPriceBubble(priceTag, sellerType, mainCategory, isVerified, isPremium) {
  const icon = CATEGORY_ICONS[mainCategory] || '📦';
  const verifiedBadge = (sellerType === 'broker' && isVerified)
    ? `<span title="Verified Broker" style="display:inline-flex;align-items:center;margin-left:2px;font-size:11px;">🛡️</span>`
    : '';

  if (isPremium) {
    // Rich Golden Pin styling with glowing pulse animation & star
    return L.divIcon({
      className: 'golden-pin-marker',
      html: `<div style="
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
        color: #78350f;
        font-weight: 800;
        font-size: 12px;
        padding: 4.5px 10px;
        border-radius: 20px;
        white-space: nowrap;
        box-shadow: 0 0 14px rgba(245, 158, 11, 0.9), 0 3px 8px rgba(0,0,0,.35);
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: 2px solid #fff;
        line-height: 1.3;
        transform: translate(-50%,-50%);
        cursor: pointer;
        animation: goldenGlowPulse 2s infinite ease-in-out;
      "><span>⭐</span><span>${icon}</span><span style="font-weight:900;letter-spacing:-0.2px;">Rs ${priceTag}</span>${verifiedBadge}</div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }

  const bg = sellerType === 'owner' ? '#16a34a' : '#2563eb'; // green for owner, blue for broker/dealer

  return L.divIcon({
    className: '',
    html: `<div style="
      background:${bg};
      color:#fff;
      font-weight:700;
      font-size:12px;
      padding:4px 9px;
      border-radius:20px;
      white-space:nowrap;
      box-shadow:0 2px 6px rgba(0,0,0,.35);
      display:inline-flex;
      align-items:center;
      gap:4px;
      border:2px solid #fff;
      line-height:1.3;
      transform:translate(-50%,-50%);
      cursor:pointer;
    "><span>${icon}</span><span>Rs ${priceTag}</span>${verifiedBadge}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// --- "Pick on map" click handler ---
function PickLocationHandler({ active, onPick }) {
  useMapEvents({
    click(e) {
      if (active) {
        onPick(e.latlng);
      }
    },
  });
  return null;
}

// --- My Location button ---
function LocateButton() {
  const map = useMap();
  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 15 });
  };
  return (
    <button
      onClick={handleLocate}
      className="absolute bottom-6 right-4 z-[1000] bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 active:scale-95 transition-transform"
      title="My location"
    >
      <LocateFixed size={22} className="text-gray-700" />
    </button>
  );
}

export default function MapPage({
  listings,
  onMarkerClick,
  pickMode,
  onPickLocation,
  onSearchChange,
  searchQuery: externalSearchQuery,
}) {
  const mapRef = useRef(null);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');

  const searchQuery =
    externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  const handleSearchChange = useCallback(
    (newQuery) => {
      setInternalSearchQuery(newQuery);
      if (onSearchChange) {
        onSearchChange(newQuery);
      }
    },
    [onSearchChange]
  );

  // Filter listings based on search text (title, description, main_category, location_name)
  const displayedListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const q = searchQuery.toLowerCase().trim();
    return listings.filter((l) => {
      const title = (l.title || '').toLowerCase();
      const description = (l.description || '').toLowerCase();
      const mainCategory = (l.mainCategory || l.main_category || '').toLowerCase();
      const locationName = (l.locationName || l.location_name || '').toLowerCase();
      const propertyType = (l.propertyType || l.property_type || '').toLowerCase();
      const vehicleType = (l.vehicleType || l.vehicle_type || '').toLowerCase();
      const brand = (l.brand || '').toLowerCase();

      return (
        title.includes(q) ||
        description.includes(q) ||
        mainCategory.includes(q) ||
        locationName.includes(q) ||
        propertyType.includes(q) ||
        vehicleType.includes(q) ||
        brand.includes(q)
      );
    });
  }, [listings, searchQuery]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[7.8731, 80.7718]} // center of Sri Lanka
        zoom={8}
        className="w-full h-full z-0"
        ref={mapRef}
        zoomControl={false}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="🛰️ Satellite View">
            <TileLayer
              attribution="&copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🗺️ Street View">
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Floating Magic Search Bar */}
        {!pickMode && (
          <MagicSearchBar
            onSearchChange={handleSearchChange}
            searchQuery={searchQuery}
            matchingListings={displayedListings}
            totalCount={displayedListings.length}
          />
        )}

        {displayedListings.map((listing) => {
          const rawImg = listing.imageUrls?.[0] || listing.imageUrl || '';
          const pinImgUrl = rawImg ? getOptimizedImageUrl(rawImg, 'pin') : '';

          return (
            <Marker
              key={listing.id}
              position={[listing.lat, listing.lng]}
              zIndexOffset={listing.isPremium ? 4999 : 0}
              icon={createPriceBubble(
                listing.priceTag,
                listing.sellerType,
                listing.mainCategory,
                listing.isVerified,
                listing.isPremium
              )}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(listing),
              }}
            >
              <Popup
                className="selinmap-pin-popup"
                maxWidth={220}
                minWidth={170}
                closeButton={false}
              >
                <div
                  onClick={() => onMarkerClick && onMarkerClick(listing)}
                  className="cursor-pointer w-full max-w-[200px] overflow-hidden text-left font-sans select-none"
                >
                  {pinImgUrl ? (
                    <img
                      src={pinImgUrl}
                      alt={listing.title}
                      className="w-full aspect-square object-cover rounded-t-md bg-gray-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-square object-cover rounded-t-md bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-semibold">
                      No Photo
                    </div>
                  )}
                  <div className="p-2.5 bg-white rounded-b-md">
                    <h4 className="text-xs font-bold text-gray-900 truncate leading-snug">
                      {listing.title}
                    </h4>
                    <p className="text-xs font-black text-emerald-600 mt-1">
                      {listing.isPremium && <span className="text-amber-500 mr-0.5">⭐</span>}
                      Rs. {Number(listing.price).toLocaleString()}
                      {listing.priceTag && (
                        <span className="text-[10px] text-gray-500 font-semibold ml-1">
                          ({listing.priceTag})
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">
                      📍 {listing.locationName || 'Sri Lanka'}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Subtle toast if query finds 0 listings */}
        {!pickMode && searchQuery.trim() && displayedListings.length === 0 && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900/85 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg pointer-events-none transition-all border border-white/10">
            No pins found matching &ldquo;{searchQuery}&rdquo;
          </div>
        )}

        <PickLocationHandler active={pickMode} onPick={onPickLocation} />
        <LocateButton />
      </MapContainer>

      {pickMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] bg-black/70 text-white px-5 py-3 rounded-xl text-sm font-medium pointer-events-none animate-pulse">
          Tap on the map to pick location
        </div>
      )}
    </div>
  );
}
