import { useState, useCallback, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';

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
}) {
  const mapRef = useRef(null);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[7.8731, 80.7718]} // center of Sri Lanka
        zoom={8}
        className="w-full h-full z-0"
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {listings.map((listing) => (
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
