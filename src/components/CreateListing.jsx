import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  useMap,
  useMapEvents,
  LayersControl,
} from 'react-leaflet';
import L from 'leaflet';
import {
  X,
  MapPin,
  ImagePlus,
  Loader2,
  Trash2,
  ChevronDown,
  Search,
  LocateFixed,
  Compass,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImages } from '../lib/uploadImage';
import { getProfile } from '../lib/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { normalizeListing } from '../lib/storage';

// Draggable custom map pin icon
const DRAGGABLE_PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #ffffff;
    width: 38px;
    height: 38px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg) translate(8px, -8px);
    border: 3px solid #ffffff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    transition: transform 0.15s ease;
  ">
    <div style="
      transform: rotate(45deg);
      width: 14px;
      height: 14px;
      background: #10b981;
      border-radius: 50%;
      border: 2px solid #ffffff;
    "></div>
  </div>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

/**
 * Leaflet helper component to auto-center the map (FlyTo)
 */
export function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && center[0] !== undefined) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

// Invalidate size helper when inside modal or toggling fullscreen
function InvalidateSizeEffect({ isExpanded }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map, isExpanded]);
  return null;
}

// Allow tapping anywhere on map to reposition pin (disabled during boundary drawing)
function MapClickHandler({ onLocationChange, disabled }) {
  useMapEvents({
    click(e) {
      if (disabled) return;
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Freehand pencil drawing tool for land boundaries
function FreehandDraw({ isDrawingMode, setBoundaryPoints }) {
  const map = useMap();
  const [isPenDown, setIsPenDown] = useState(false);

  // CRITICAL: Disable map panning when the pencil tool is active so mobile users can draw instead of scrolling the map
  useEffect(() => {
    if (isDrawingMode) {
      map.dragging.disable();
      map.touchZoom.disable();
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
    }
  }, [isDrawingMode, map]);

  useMapEvents({
    mousedown(e) {
      if (!isDrawingMode) return;
      setIsPenDown(true);
      // Start a brand new shape
      setBoundaryPoints([[e.latlng.lat, e.latlng.lng]]);
    },
    mousemove(e) {
      if (!isDrawingMode || !isPenDown) return;
      // Add points smoothly as they drag
      setBoundaryPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    },
    mouseup() {
      if (!isDrawingMode) return;
      setIsPenDown(false);
    },
    // Handle mobile touches going off-screen
    mouseout() {
      setIsPenDown(false);
    },
  });

  // Mobile touch event listeners on the map container
  useEffect(() => {
    if (!isDrawingMode) return;

    const container = map.getContainer();

    const handleTouchStart = (e) => {
      if (!isDrawingMode || e.touches.length === 0) return;
      setIsPenDown(true);
      const touch = e.touches[0];
      const point = map.mouseEventToLatLng(touch);
      setBoundaryPoints([[point.lat, point.lng]]);
    };

    const handleTouchMove = (e) => {
      if (!isDrawingMode || e.touches.length === 0) return;
      const touch = e.touches[0];
      const point = map.mouseEventToLatLng(touch);
      setBoundaryPoints((prev) => [...prev, [point.lat, point.lng]]);
    };

    const handleTouchEnd = () => {
      setIsPenDown(false);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDrawingMode, map, setBoundaryPoints]);

  return null;
}

const MAIN_CATEGORIES = [
  { key: 'real_estate', label: 'Real Estate 🏠' },
  { key: 'vehicles', label: 'Vehicles 🚗' },
  { key: 'electronics', label: 'Electronics 📱' },
  { key: 'services', label: 'Services 🛠️' },
  { key: 'others', label: 'Others 📦' },
];

const REAL_ESTATE_TYPES = [
  { key: 'land', label: 'Land & Plots' },
  { key: 'house', label: 'Houses & Villas' },
  { key: 'apartment', label: 'Apartments & Condos' },
  { key: 'commercial', label: 'Commercial Property' },
  { key: 'villa', label: 'Holiday Homes / Villas' },
  { key: 'other', label: 'Other Real Estate' },
];

const VEHICLE_TYPES = [
  { key: 'car', label: 'Car' },
  { key: 'bike', label: 'Motorbike / Scooter' },
  { key: 'van', label: 'Van / Bus' },
  { key: 'tuk', label: 'Three Wheeler (Tuk)' },
  { key: 'suv', label: 'SUV & Jeep' },
  { key: 'lorry', label: 'Lorry & Heavy Duty' },
  { key: 'other', label: 'Other Vehicle' },
];

const VEHICLE_BRANDS = [
  'Toyota',
  'Honda',
  'Nissan',
  'Suzuki',
  'Mitsubishi',
  'Hyundai',
  'Kia',
  'Mazda',
  'Daihatsu',
  'Bajaj',
  'TVS',
  'Yamaha',
  'Hero',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Tata',
  'Mahindra',
  'Other',
];

const ELECTRONICS_TYPES = [
  { key: 'mobile', label: 'Mobile Phone' },
  { key: 'laptop', label: 'Laptop & Computer' },
  { key: 'tv', label: 'TV & Home Audio' },
  { key: 'camera', label: 'Camera & Optics' },
  { key: 'tablet', label: 'Tablet & iPad' },
  { key: 'audio', label: 'Headphones & Audio' },
  { key: 'other', label: 'Other Electronics' },
];

const ELECTRONICS_BRANDS = [
  'Apple',
  'Samsung',
  'Sony',
  'Xiaomi',
  'Google',
  'Dell',
  'HP',
  'Lenovo',
  'Asus',
  'Acer',
  'LG',
  'Panasonic',
  'Canon',
  'Nikon',
  'Huawei',
  'JBL',
  'Other',
];

const SERVICES_TYPES = [
  { key: 'home_construction', label: 'Construction & Renovation' },
  { key: 'vehicle_repair', label: 'Auto & Vehicle Repair' },
  { key: 'it_services', label: 'IT, Web & Graphic Design' },
  { key: 'cleaning', label: 'Cleaning & Housekeeping' },
  { key: 'tuition', label: 'Tuition & Education' },
  { key: 'electrical_plumbing', label: 'Electrical & Plumbing' },
  { key: 'other', label: 'Other Services' },
];

const TRANSMISSIONS = ['Automatic', 'Manual'];
const CONDITIONS = ['Brand New', 'Like New', 'Used'];
const SELLER_TYPES = [
  { key: 'owner', label: 'Owner' },
  { key: 'broker', label: 'Broker' },
  { key: 'dealer', label: 'Dealer' },
];

function generateDefaultPriceTag(val) {
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

export default function CreateListing({
  open,
  onClose,
  onSave,
  onPickMode,
  user,
  profile,
}) {
  const [mainCategory, setMainCategory] = useState('real_estate');
  const [subCategory, setSubCategory] = useState('land');
  const [propertyType, setPropertyType] = useState('land');
  const [size, setSize] = useState('');

  // Vehicle specific
  const [vehicleType, setVehicleType] = useState('car');
  const [brand, setBrand] = useState('Toyota');
  const [customBrand, setCustomBrand] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [transmission, setTransmission] = useState('Automatic');

  // Electronics specific
  const [electronicsType, setElectronicsType] = useState('mobile');

  // Services specific
  const [serviceType, setServiceType] = useState('home_construction');

  // Electronics / Others specific
  const [condition, setCondition] = useState('Used');
  const [model, setModel] = useState('');

  // Shared fields
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [priceTag, setPriceTag] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locationSelected, setLocationSelected] = useState(false);
  const [phone, setPhone] = useState('');
  const [sellerType, setSellerType] = useState('owner');
  const [description, setDescription] = useState('');

  // Location marker & map state (valid array of numbers for Sri Lanka)
  const [markerPosition, setMarkerPosition] = useState([7.8731, 80.7718]);
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState('');
  const markerRef = useRef(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  // Images & submit state
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  // Auto-fill phone and profile details when opened
  useEffect(() => {
    if (open) {
      if (profile?.phone) {
        setPhone(profile.phone);
      } else if (user?.id || user?.uid) {
        const uid = user.id || user.uid;
        getProfile(uid).then((prof) => {
          if (prof?.phone) setPhone(prof.phone);
          if (prof?.userType) setSellerType(prof.userType);
        });
      }
      if (profile?.userType) {
        setSellerType(profile.userType);
      }
    }
  }, [open, profile, user]);

  const updateCoordinates = useCallback((newLat, newLng, newLocationName = null) => {
    const roundedLat = parseFloat(Number(newLat).toFixed(6));
    const roundedLng = parseFloat(Number(newLng).toFixed(6));
    setMarkerPosition([roundedLat, roundedLng]);
    setLat(roundedLat);
    setLng(roundedLng);
    setLocationSelected(true);

    if (newLocationName) {
      setLocationName(newLocationName);
    }
  }, []);

  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newLatLng = marker.getLatLng();
          updateCoordinates(newLatLng.lat, newLatLng.lng);
        }
      },
    }),
    [updateCoordinates]
  );

  // State updater helper for newListing compatibility
  const setNewListing = (updater) => {
    if (typeof updater === 'function') {
      const updated = updater({ location_name: locationName, lat, lng });
      if (updated?.location_name) setLocationName(updated.location_name);
      if (updated?.lat) setLat(updated.lat);
      if (updated?.lng) setLng(updated.lng);
    }
  };

  const handleSearchLocation = async () => {
    if (!searchText) return;
    setIsSearching(true);
    console.log(`🧠 Asking Google Brain (NEW API) for: "${searchText} Sri Lanka"`);

    try {
      const apiKey =
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyD9WsGnRKKtbehjrehRer-LKy7R1LcynxY';

      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
        },
        body: JSON.stringify({
          textQuery: searchText + ' Sri Lanka',
        }),
      });

      const data = await response.json();
      console.log('🧠 Google New API Response:', data);

      if (data.places && data.places.length > 0) {
        const place = data.places[0];
        const lat = place.location.latitude;
        const lng = place.location.longitude;
        const name = place.displayName?.text || place.formattedAddress;

        console.log(`📍 Found coordinates: Lat ${lat}, Lng ${lng}`);

        setMarkerPosition([lat, lng]);
        setLat(lat);
        setLng(lng);
        setLocationSelected(true);
        setLocationName(name);
        setNewListing((prev) => ({ ...prev, location_name: name }));
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error connecting to Google.');
    } finally {
      setIsSearching(false);
    }
  };

  // Detect current GPS location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationFeedback('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        updateCoordinates(userLat, userLng);

        try {
          const revUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}`;
          const res = await fetch(revUrl, {
            headers: { 'Accept-Language': 'en' },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name && (!locationName || locationName === 'Sri Lanka')) {
              const parts = data.display_name.split(',').map((s) => s.trim());
              const cleanName = parts.slice(0, 3).join(', ');
              setLocationName(cleanName);
            }
          }
        } catch {
          // ignore
        }

        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not determine current location: ' + err.message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  if (!open) return null;

  const handlePriceChange = (e) => {
    const val = e.target.value;
    setPrice(val);
    if (!priceTag || priceTag === generateDefaultPriceTag(price)) {
      setPriceTag(generateDefaultPriceTag(val));
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalAllowed = 5 - imageFiles.length;
    const toAdd = files.slice(0, totalAllowed);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });

    setImageFiles((prev) => [...prev, ...toAdd]);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMainCategoryChange = (newCat) => {
    setMainCategory(newCat);
    if (newCat === 'real_estate') {
      setSubCategory('land');
      setPropertyType('land');
    } else if (newCat === 'vehicles') {
      setSubCategory('car');
      setVehicleType('car');
      setBrand('Toyota');
    } else if (newCat === 'electronics') {
      setSubCategory('mobile');
      setElectronicsType('mobile');
      setBrand('Apple');
    } else if (newCat === 'services') {
      setSubCategory('home_construction');
      setServiceType('home_construction');
      setBrand('');
    } else {
      setSubCategory('other');
      setBrand('');
    }
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    const numLat = parseFloat(lat ?? markerPosition[0]);
    const numLng = parseFloat(lng ?? markerPosition[1]);

    if (isNaN(numLat) || isNaN(numLng)) {
      alert('Please select a location on the map or search bar.');
      return;
    }

    if (!title.trim() || !price || isNaN(Number(price))) {
      alert('Please fill in title and a valid price.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrls = [];
      if (imageFiles.length > 0) {
        console.log(`📤 Uploading ${imageFiles.length} image(s) to Cloudinary...`);
        const uploaded = await uploadImages(imageFiles);
        imageUrls = (uploaded || []).filter(Boolean);
        console.log('✅ Cloudinary secure_url results:', imageUrls);
      }

      const effectiveBrand = brand === 'Other' ? (customBrand || 'Other') : (brand || '');
      const activeSubCategory =
        mainCategory === 'real_estate'
          ? propertyType
          : mainCategory === 'vehicles'
          ? vehicleType
          : mainCategory === 'electronics'
          ? electronicsType
          : mainCategory === 'services'
          ? serviceType
          : subCategory || 'other';

      const isUUID =
        typeof user?.id === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user?.id);

      // 1. Base listing fields common to all categories
      const newListingData = {
        user_id: isUUID ? user.id : null,
        title: title.trim(),
        price: Number(price),
        price_tag: priceTag || generateDefaultPriceTag(price) || 'N/A',
        main_category: mainCategory || 'others',
        sub_category: activeSubCategory || null,
        location_name: locationName.trim() || 'Sri Lanka',
        lat: numLat,
        lng: numLng,
        description: description.trim(),
        image_urls: imageUrls,
        seller_name: profile?.name || user?.email?.split('@')[0] || 'Seller',
        seller_phone: phone || profile?.phone || '',
        seller_type: sellerType || 'owner',
        is_premium: false,
      };

      // 2. Category-specific fields ONLY if matching main_category
      if (mainCategory === 'real_estate') {
        if (propertyType || activeSubCategory) {
          newListingData.property_type = propertyType || activeSubCategory;
        }
        if (size && size.trim()) {
          newListingData.size = size.trim();
        }
        if (Array.isArray(boundaryPoints) && boundaryPoints.length > 0) {
          newListingData.land_boundaries = boundaryPoints;
        }
      } else if (mainCategory === 'vehicles') {
        if (vehicleType || activeSubCategory) {
          newListingData.vehicle_type = vehicleType || activeSubCategory;
        }
        if (effectiveBrand && effectiveBrand.trim()) {
          newListingData.brand = effectiveBrand.trim();
        }
        if (model && model.trim()) {
          newListingData.model = model.trim();
        }
        if (year && String(year).trim()) {
          newListingData.year = String(year).trim();
        }
        if (mileage && mileage.trim()) {
          newListingData.mileage = mileage.trim();
        }
        if (transmission) {
          newListingData.transmission = transmission;
        }
      } else if (mainCategory === 'electronics') {
        if (effectiveBrand && effectiveBrand.trim()) {
          newListingData.brand = effectiveBrand.trim();
        }
        if (model && model.trim()) {
          newListingData.model = model.trim();
        }
        if (condition) {
          newListingData.condition = condition;
        }
      } else if (mainCategory === 'others') {
        if (effectiveBrand && effectiveBrand.trim()) {
          newListingData.brand = effectiveBrand.trim();
        }
        if (model && model.trim()) {
          newListingData.model = model.trim();
        }
        if (condition) {
          newListingData.condition = condition;
        }
      }

      // 3. Strictly sanitize: remove empty strings, null, or undefined
      const payload = { ...newListingData };
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
      });

      // 4. Wrap supabase.from('listings').insert(...) in strict try/catch
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('listings').insert([payload]).select();
        if (error) throw error;

        if (onSave) {
          await onSave(data && data[0] ? normalizeListing(data[0]) : payload);
        }
      } else {
        if (onSave) {
          await onSave(payload);
        }
      }

      toast.success('Listing created successfully!');

      // Reset form
      setTitle('');
      setPrice('');
      setPriceTag('');
      setSize('');
      setBrand('Toyota');
      setCustomBrand('');
      setYear('');
      setMileage('');
      setModel('');
      setLocationName('');
      setLat(null);
      setLng(null);
      setLocationSelected(false);
      setBoundaryPoints([]);
      setIsDrawingMode(false);
      setImageFiles([]);
      setImagePreviews([]);
      onClose();
    } catch (err) {
      console.error('Create Listing Error:', err);
      alert('Failed to create listing: ' + (err.message || 'Please try again.'));
      toast.error('Failed to create listing: ' + (err.message || 'Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[3000]" onClick={onClose} />

      <div className="fixed inset-x-0 top-0 bottom-0 z-[3001] flex items-start justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Post a Listing</h2>
              <p className="text-xs text-gray-500">Pin your item on Sri Lanka's live marketplace map</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 cursor-pointer">
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4 text-left">
            {/* Step 1: Main Category */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                1. Main Category *
              </label>
              <div className="relative">
                <select
                  value={mainCategory}
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  {MAIN_CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Step 2: Dynamic Category-Specific Fields */}
            <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/80 space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                2. Category Specifications
              </h3>

              {/* REAL ESTATE */}
              {mainCategory === 'real_estate' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Property Type *
                      </label>
                      <div className="relative">
                        <select
                          value={propertyType}
                          onChange={(e) => {
                            setPropertyType(e.target.value);
                            setSubCategory(e.target.value);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          {REAL_ESTATE_TYPES.map((t) => (
                            <option key={t.key} value={t.key}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Size / Area
                      </label>
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        placeholder="e.g. 15 perches or 2,400 sqft"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* VEHICLES */}
              {mainCategory === 'vehicles' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Vehicle Type *
                      </label>
                      <div className="relative">
                        <select
                          value={vehicleType}
                          onChange={(e) => {
                            setVehicleType(e.target.value);
                            setSubCategory(e.target.value);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          {VEHICLE_TYPES.map((t) => (
                            <option key={t.key} value={t.key}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Brand *
                      </label>
                      <div className="relative">
                        <select
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          {VEHICLE_BRANDS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {brand === 'Other' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Custom Brand Name</label>
                      <input
                        type="text"
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        placeholder="Enter vehicle make / brand"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Model *</label>
                    <input
                      type="text"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. Vitz, Civic, Axio, Prius, Swift, Pulsar..."
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                      <input
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="e.g. 2021"
                        className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Mileage</label>
                      <input
                        type="text"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        placeholder="e.g. 45,000 km"
                        className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Gear</label>
                      <select
                        value={transmission}
                        onChange={(e) => setTransmission(e.target.value)}
                        className="w-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {TRANSMISSIONS.map((tr) => (
                          <option key={tr} value={tr}>
                            {tr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* ELECTRONICS */}
              {mainCategory === 'electronics' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Device Type *
                      </label>
                      <div className="relative">
                        <select
                          value={electronicsType}
                          onChange={(e) => {
                            setElectronicsType(e.target.value);
                            setSubCategory(e.target.value);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          {ELECTRONICS_TYPES.map((t) => (
                            <option key={t.key} value={t.key}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Brand *</label>
                      <div className="relative">
                        <select
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          {ELECTRONICS_BRANDS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Model / Specs</label>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. iPhone 15 Pro Max 256GB"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Condition</label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CONDITIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* SERVICES */}
              {mainCategory === 'services' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Service Type *
                    </label>
                    <div className="relative">
                      <select
                        value={serviceType}
                        onChange={(e) => {
                          setServiceType(e.target.value);
                          setSubCategory(e.target.value);
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                      >
                        {SERVICES_TYPES.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </>
              )}

              {/* OTHERS */}
              {mainCategory === 'others' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Item Type / Category</label>
                      <input
                        type="text"
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        placeholder="e.g. Furniture, Sports, Pets..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Condition</label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CONDITIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Listing Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Luxury 4BR Villa in Thalawathugoda"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Price & Price Tag */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Price (LKR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={handlePriceChange}
                  placeholder="e.g. 25000000"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Map Badge <span className="text-gray-400 font-normal">(Auto)</span>
                </label>
                <input
                  type="text"
                  value={priceTag}
                  onChange={(e) => setPriceTag(e.target.value)}
                  placeholder="e.g. 25M / 150k"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Photos <span className="text-gray-400 font-normal">(up to 5)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group border border-gray-200">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                ))}
                {imageFiles.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors bg-gray-50 cursor-pointer"
                  >
                    <ImagePlus size={20} />
                    <span className="text-[10px] mt-0.5 font-semibold">Upload</span>
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Location & Map Section with Google Autocomplete & Leaflet */}
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Location Name
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Cinnamon Gardens, Colombo 07"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Pin Location on Map *
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Search city/landmark or drag pin
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Custom Geocoding Search Bar & Current Location Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1 flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          placeholder="Type a city or landmark (e.g., Nugegoda) and click Search..."
                          className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSearchLocation();
                            }
                          }}
                        />
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      <button
                        type="button"
                        onClick={handleSearchLocation}
                        disabled={isSearching}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {isSearching ? 'Searching...' : 'Search'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocating}
                      className="shrink-0 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                      title="Detect your current GPS location"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Locating...</span>
                        </>
                      ) : (
                        <>
                          <LocateFixed size={14} />
                          <span>📍 Use Current Location</span>
                        </>
                      )}
                    </button>
                  </div>

                  {locationFeedback && (
                    <p className="text-[11px] font-semibold text-blue-600 animate-fade-in flex items-center gap-1">
                      <Compass size={12} />
                      <span>{locationFeedback}</span>
                    </p>
                  )}

                  {/* Leaflet MapContainer with Fullscreen Toggle */}
                  <div
                    className={
                      isMapExpanded
                        ? 'fixed inset-0 z-[9999] bg-white'
                        : 'relative h-[400px] w-full rounded-lg overflow-hidden border border-gray-300'
                    }
                  >
                    {/* Floating Controls over the Map */}
                    {isMapExpanded && (
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400]">
                        <button
                          type="button"
                          onClick={() => setIsMapExpanded(false)}
                          className="bg-blue-600 text-white px-8 py-3 rounded-full shadow-xl font-semibold border-2 border-white hover:bg-blue-700 cursor-pointer transition-all active:scale-95"
                        >
                          ✓ Confirm Location
                        </button>
                      </div>
                    )}

                    {/* Land Boundary Drawing Toolbar (Fullscreen & Real Estate only) */}
                    {isMapExpanded &&
                      (mainCategory === 'real_estate' || mainCategory === 'Real Estate') && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-xl border border-gray-200">
                          <button
                            type="button"
                            onClick={() => setIsDrawingMode((prev) => !prev)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                              isDrawingMode
                                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <span>✏️</span>
                            <span>{isDrawingMode ? 'Pencil Active (Drag to Draw)' : '✏️ Freehand Pencil'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBoundaryPoints([])}
                            disabled={boundaryPoints.length === 0}
                            className="px-3.5 py-2 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                          >
                            <span>🗑️</span>
                            <span>Clear Shape</span>
                          </button>
                          {boundaryPoints.length > 0 && (
                            <span className="text-[11px] font-mono font-semibold text-gray-600 pr-2">
                              {boundaryPoints.length} pts
                            </span>
                          )}
                        </div>
                      )}

                    <button
                      type="button"
                      onClick={() => setIsMapExpanded(!isMapExpanded)}
                      className="absolute bottom-6 right-4 z-[400] bg-white p-3 rounded-full shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer transition-all active:scale-95 text-xs font-bold"
                    >
                      {isMapExpanded ? '↙️ Minimize Map' : '⛶ Maximize Map'}
                    </button>

                    <MapContainer
                      center={markerPosition}
                      zoom={14}
                      maxZoom={22}
                      scrollWheelZoom={true}
                      zoomControl={false}
                      className={`w-full h-full z-0 ${isDrawingMode ? 'cursor-crosshair' : ''}`}
                      attributionControl={false}
                    >
                      <LayersControl position="bottomleft">
                        <LayersControl.BaseLayer checked name="🛰️ Satellite View">
                          <TileLayer
                            attribution="&copy; Google Maps"
                            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                            maxZoom={21}
                          />
                        </LayersControl.BaseLayer>

                        <LayersControl.BaseLayer name="🗺️ Street View">
                          <TileLayer
                            attribution="&copy; Google Maps"
                            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                            maxZoom={21}
                          />
                        </LayersControl.BaseLayer>
                      </LayersControl>

                      {/* Draggable Marker */}
                      <Marker
                        draggable={true}
                        eventHandlers={markerEventHandlers}
                        position={markerPosition}
                        ref={markerRef}
                        icon={DRAGGABLE_PIN_ICON}
                      />

                      <MapClickHandler onLocationChange={updateCoordinates} disabled={isDrawingMode} />
                      <FreehandDraw isDrawingMode={isDrawingMode} setBoundaryPoints={setBoundaryPoints} />

                      {/* Current boundary polygon shape being drawn */}
                      {boundaryPoints.length > 0 && (
                        <Polygon
                          positions={boundaryPoints}
                          pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2, weight: 3 }}
                        />
                      )}

                      {/* Leaflet MapUpdater Component */}
                      <MapUpdater center={markerPosition} />
                      <InvalidateSizeEffect isExpanded={isMapExpanded} />
                    </MapContainer>

                    {/* Floating guidance overlay */}
                    <div className="absolute top-2 left-2 z-[400] bg-black/65 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-full pointer-events-none shadow-sm flex items-center gap-1">
                      <span>🖐️ Drag pin or tap map to position</span>
                    </div>

                    {/* Coordinates badge pill */}
                    <div className="absolute bottom-6 left-4 z-[400] bg-white/95 backdrop-blur-xs text-gray-700 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shadow-sm border border-gray-200/80 pointer-events-none flex items-center gap-1">
                      <MapPin size={11} className="text-emerald-600" />
                      <span>
                        {markerPosition[0].toFixed(4)}, {markerPosition[1].toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Type & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  You are *
                </label>
                <select
                  value={sellerType}
                  onChange={(e) => setSellerType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {SELLER_TYPES.map((st) => (
                    <option key={st.key} value={st.key}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0771234567"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item, key features, amenities or reason for selling..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 bg-gray-950 hover:bg-gray-800 active:scale-[0.99] disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Publishing Pin...</span>
                  </>
                ) : (
                  <span>Publish Listing to Map</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export { CreateListing };
