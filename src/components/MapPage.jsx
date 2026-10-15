import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
  LayersControl,
} from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';
import MagicSearchBar from './MagicSearchBar';

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
  others: '📦',
};

// --- Price bubble marker factory with category emoji & verified broker badge ---
function createPriceBubble(priceTag, sellerType, mainCategory, isVerified) {
  const bg = sellerType === 'owner' ? '#16a34a' : '#2563eb'; // green for owner, blue for broker/dealer
  const icon = CATEGORY_ICONS[mainCategory] || '📦';
  const verifiedBadge = (sellerType === 'broker' && isVerified)
    ? `<span title="Verified Broker" style="display:inline-flex;align-items:center;margin-left:2px;font-size:11px;">🛡️</span>`
    : '';

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

        {displayedListings.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.lat, listing.lng]}
            icon={createPriceBubble(
              listing.priceTag,
              listing.sellerType,
              listing.mainCategory,
              listing.isVerified
            )}
            eventHandlers={{
              click: () => onMarkerClick(listing),
            }}
          />
        ))}

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
