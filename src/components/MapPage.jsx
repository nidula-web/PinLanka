import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Popup,
  useMapEvents,
  useMap,
  LayersControl,
} from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';
import MagicSearchBar from './MagicSearchBar';
import { getOptimizedImageUrl } from '../utils/cloudinary';
import { normalizeListing } from '../lib/storage';
import { supabase } from '../lib/supabase';

// Helper component to auto-fly and zoom directly into polygon boundaries
function BoundaryFocuser({ boundaries }) {
  const map = useMap();
  useEffect(() => {
    if (Array.isArray(boundaries) && boundaries.length > 2) {
      try {
        const bounds = L.latLngBounds(boundaries);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 19, animate: true });
      } catch (err) {
        console.warn('Boundary fitBounds error:', err);
      }
    }
  }, [map, boundaries]);
  return null;
}

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

function formatPriceTag(val) {
  const num = Number(val);
  if (!num || isNaN(num)) return '';
  if (num >= 1000000) {
    const m = num / 1000000;
    return `${Number(m.toFixed(2))}M`;
  }
  if (num >= 1000) {
    const k = num / 1000;
    return `${Number(k.toFixed(1))}k`;
  }
  return String(num);
}

/**
 * Custom L.divIcon marker factory:
 * - Gold with glowing effect shadow-[0_0_15px_rgba(250,204,21,0.8)] if is_premium and active
 * - Blue if seller_type === 'broker'
 * - Green otherwise (Owner)
 */
function createCustomMarkerIcon(listing, isPremium) {
  const sellerType = listing.seller_type || listing.sellerType || 'owner';
  const mainCategory = listing.main_category || listing.mainCategory || 'others';
  const icon = CATEGORY_ICONS[mainCategory] || '📦';
  const priceDisplay =
    listing.price_tag ||
    listing.priceTag ||
    (listing.price ? formatPriceTag(listing.price) : '');
  const isVerified = Boolean(listing.is_verified || listing.isVerified);
  const verifiedBadge =
    sellerType === 'broker' && isVerified
      ? `<span title="Verified Broker" style="display:inline-flex;align-items:center;margin-left:2px;font-size:11px;">🛡️</span>`
      : '';

  // 1. Gold with glowing effect: shadow-[0_0_15px_rgba(250,204,21,0.8)]
  if (isPremium) {
    return L.divIcon({
      className: 'custom-map-marker golden-pin-marker',
      html: `<div class="shadow-[0_0_15px_rgba(250,204,21,0.8)]" style="
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
        color: #78350f;
        font-weight: 800;
        font-size: 12px;
        padding: 4.5px 10px;
        border-radius: 20px;
        white-space: nowrap;
        box-shadow: 0 0 15px rgba(250,204,21,0.8), 0 3px 8px rgba(0,0,0,0.35);
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: 2px solid #ffffff;
        line-height: 1.3;
        transform: translate(-50%, -50%);
        cursor: pointer;
        animation: goldenGlowPulse 2s infinite ease-in-out;
      "><span>⭐</span><span>${icon}</span><span style="font-weight:900;letter-spacing:-0.2px;">${priceDisplay ? `Rs ${priceDisplay}` : ''}</span>${verifiedBadge}</div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }

  // 2. If listing.seller_type === 'broker', make it Blue. Otherwise, Green (Owner).
  const isBroker = sellerType === 'broker';
  const bg = isBroker ? '#2563eb' : '#16a34a';

  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
      background: ${bg};
      color: #ffffff;
      font-weight: 700;
      font-size: 12px;
      padding: 4px 9px;
      border-radius: 20px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 2px solid #ffffff;
      line-height: 1.3;
      transform: translate(-50%, -50%);
      cursor: pointer;
    "><span>${icon}</span><span>${priceDisplay ? `Rs ${priceDisplay}` : ''}</span>${verifiedBadge}</div>`,
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
  listings: propListings,
  onMarkerClick,
  activeListing: propActiveListing,
  flyToBoundaries,
  pickMode,
  onPickLocation,
  onSearchChange,
  searchQuery: externalSearchQuery,
}) {
  const mapRef = useRef(null);
  const [internalActiveListing, setInternalActiveListing] = useState(null);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  // 1. Store listings in a state variable
  const [listings, setListings] = useState([]);

  const activeListing =
    propActiveListing !== undefined ? propActiveListing : internalActiveListing;

  // 1. Fetch ALL listings from Supabase on mount
  useEffect(() => {
    const fetchMapListings = async () => {
      try {
        const { data, error } = await supabase.from('listings').select('*');
        if (error) {
          console.error('Error fetching map listings from Supabase:', error);
          if (propListings && propListings.length > 0) {
            setListings(propListings);
          }
          return;
        }
        if (data) {
          setListings(data);
        }
      } catch (err) {
        console.error('Map listings fetch error:', err);
        if (propListings && propListings.length > 0) {
          setListings(propListings);
        }
      }
    };

    fetchMapListings();
  }, []);

  // Real-time synchronization for changes to Supabase listings table
  useEffect(() => {
    const channel = supabase
      .channel('public:listings:map-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        async () => {
          const { data, error } = await supabase.from('listings').select('*');
          if (!error && data) {
            setListings(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fallback to propListings if passed and no direct listings fetched yet
  useEffect(() => {
    if (propListings && propListings.length > 0 && listings.length === 0) {
      setListings(propListings);
    }
  }, [propListings, listings.length]);

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
    const sourceList = listings.length > 0 ? listings : (propListings || []);
    if (!searchQuery.trim()) return sourceList;
    const q = searchQuery.toLowerCase().trim();
    return sourceList.filter((l) => {
      const title = (l.title || '').toLowerCase();
      const description = (l.description || '').toLowerCase();
      const mainCategory = (l.main_category || l.mainCategory || '').toLowerCase();
      const locationName = (l.location_name || l.locationName || '').toLowerCase();
      const propertyType = (l.property_type || l.propertyType || '').toLowerCase();
      const vehicleType = (l.vehicle_type || l.vehicleType || '').toLowerCase();
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
  }, [listings, propListings, searchQuery]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[7.8731, 80.7718]} // center of Sri Lanka
        zoom={8}
        maxZoom={22}
        className="w-full h-full z-0"
        ref={mapRef}
        zoomControl={false}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="🛰️ Satellite View">
            <TileLayer
              attribution="&copy; Google Maps"
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxZoom={21}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="🗺️ Street View">
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxNativeZoom={19}
              maxZoom={22}
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

        {/* 2. If activeListing has land_boundaries, render premium glowing Polygon */}
        {(() => {
          const rawBoundaries = activeListing?.land_boundaries || activeListing?.landBoundaries;
          if (Array.isArray(rawBoundaries) && rawBoundaries.length > 2) {
            return (
              <>
                {/* Outer Glow Stroke */}
                <Polygon
                  positions={rawBoundaries}
                  pathOptions={{
                    color: '#f59e0b',
                    weight: 8,
                    opacity: 0.45,
                    fillOpacity: 0,
                  }}
                />
                {/* Core Gold Polygon */}
                <Polygon
                  positions={rawBoundaries}
                  pathOptions={{
                    color: '#d97706',
                    weight: 3,
                    fillColor: '#fbbf24',
                    fillOpacity: 0.35,
                    dashArray: '6, 6',
                  }}
                />
              </>
            );
          }
          return null;
        })()}

        {/* Auto fly/zoom into polygon boundaries if requested */}
        <BoundaryFocuser boundaries={flyToBoundaries} />

        {/* 3. Map over the listings array */}
        {displayedListings.map((listing) => {
          // CRITICAL: Only render a <Marker> if the listing has valid coordinates
          if (!listing.lat || !listing.lng) return null;

          // Parse lat and lng as numbers
          const lat = parseFloat(listing.lat);
          const lng = parseFloat(listing.lng);
          if (isNaN(lat) || isNaN(lng)) return null;

          // 3. Golden Pin Logic:
          // If listing.is_premium === true AND (premium_expires_at is null or in the future)
          const isPremium =
            Boolean(listing.is_premium === true || listing.isPremium === true) &&
            (!listing.premium_expires_at && !listing.premiumExpiresAt
              ? true
              : new Date(listing.premium_expires_at || listing.premiumExpiresAt) > new Date());

          const rawImg =
            (Array.isArray(listing.image_urls) ? listing.image_urls[0] : null) ||
            (Array.isArray(listing.imageUrls) ? listing.imageUrls[0] : null) ||
            listing.imageUrl ||
            '';
          const pinImgUrl = rawImg ? getOptimizedImageUrl(rawImg, 'pin') : '';

          const handlePinSelect = () => {
            const normalized = normalizeListing ? normalizeListing(listing) : listing;
            setInternalActiveListing(normalized);
            if (onMarkerClick) {
              onMarkerClick(normalized);
            }
          };

          return (
            <Marker
              key={listing.id || `${lat}-${lng}`}
              position={[parseFloat(listing.lat), parseFloat(listing.lng)]}
              zIndexOffset={isPremium ? 1000 : 0}
              icon={createCustomMarkerIcon(listing, isPremium)}
              eventHandlers={{
                click: handlePinSelect,
              }}
            >
              <Popup
                className="sellinmap-pin-popup"
                maxWidth={230}
                minWidth={180}
                closeButton={false}
              >
                <div
                  onClick={handlePinSelect}
                  className="cursor-pointer w-full max-w-[210px] overflow-hidden text-left font-sans select-none rounded-2xl"
                >
                  {pinImgUrl ? (
                    <img
                      src={pinImgUrl}
                      alt={listing.title}
                      className="w-full aspect-[4/3] object-cover bg-gray-100"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] object-cover bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-semibold">
                      No Photo
                    </div>
                  )}
                  <div className="p-3 bg-white">
                    <h4 className="text-xs font-bold text-gray-900 truncate leading-snug">
                      {listing.title}
                    </h4>
                    <p className="text-xs font-black text-emerald-600 mt-1">
                      {isPremium && <span className="text-amber-500 mr-0.5">⭐</span>}
                      Rs. {Number(listing.price).toLocaleString()}
                      {(listing.price_tag || listing.priceTag) && (
                        <span className="text-[10px] text-gray-500 font-semibold ml-1">
                          ({listing.price_tag || listing.priceTag})
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">
                      📍 {listing.location_name || listing.locationName || 'Sri Lanka'}
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
