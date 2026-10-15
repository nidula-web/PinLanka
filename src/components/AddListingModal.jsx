import { useState, useRef, useEffect } from 'react';
import { X, MapPin, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadImages } from '../lib/uploadImage';
import { getProfile } from '../lib/auth';
import SmartLocationPicker from './SmartLocationPicker';

const CATEGORIES = [
  { key: 'real_estate', label: 'Real Estate', icon: '🏠' },
  { key: 'vehicles', label: 'Vehicles', icon: '🚗' },
  { key: 'electronics', label: 'Electronics', icon: '📱' },
  { key: 'others', label: 'Others', icon: '📦' },
];

const PROPERTY_TYPES = ['land', 'house', 'apartment', 'commercial'];
const VEHICLE_TYPES = ['car', 'bike', 'van', 'tuk', 'other'];
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

export default function AddListingModal({
  open,
  onClose,
  onSave,
  onPickMode,
  user,
  profile,
}) {
  const [mainCategory, setMainCategory] = useState('real_estate');
  const [propertyType, setPropertyType] = useState('land');
  const [size, setSize] = useState('');

  // Vehicle specific
  const [vehicleType, setVehicleType] = useState('car');
  const [brand, setBrand] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [transmission, setTransmission] = useState('Automatic');

  // Electronics / Others specific
  const [condition, setCondition] = useState('Used');
  const [model, setModel] = useState('');

  // Shared fields
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [priceTag, setPriceTag] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState(6.9271);
  const [lng, setLng] = useState(79.8612);
  const [phone, setPhone] = useState('');
  const [sellerType, setSellerType] = useState('owner');
  const [description, setDescription] = useState('');

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

  if (!open) return null;

  // Auto calculate price tag if user hasn't explicitly customized it
  const handlePriceChange = (e) => {
    const val = e.target.value;
    setPrice(val);
    if (!priceTag || priceTag === generateDefaultPriceTag(price)) {
      setPriceTag(generateDefaultPriceTag(val));
    }
  };

  // Image handling
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

  const handlePickMap = () => {
    onPickMode((latlng) => {
      setLat(latlng.lat.toFixed(6));
      setLng(latlng.lng.toFixed(6));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !price || !lat || !lng) {
      alert('Please fill in required fields: Title, Price, and Coordinates.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrls = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages(imageFiles);
      }

      const baseListing = {
        mainCategory,
        title,
        price: Number(price),
        priceTag: priceTag || generateDefaultPriceTag(price) || 'N/A',
        locationName: locationName || 'Sri Lanka',
        lat: Number(lat),
        lng: Number(lng),
        description,
        imageUrls,
        sellerId: user?.id || user?.uid || 'guest',
        sellerName: profile?.name || user?.email?.split('@')[0] || 'Seller',
        sellerPhone: phone || profile?.phone || '',
        sellerType: sellerType || 'owner',
        sellerAvatar: profile?.avatar_url || profile?.avatarUrl || '',
        sellerBio: profile?.bio || '',
      };

      // Add category specific attributes
      if (mainCategory === 'real_estate') {
        baseListing.propertyType = propertyType;
        baseListing.size = size;
      } else if (mainCategory === 'vehicles') {
        baseListing.vehicleType = vehicleType;
        baseListing.brand = brand;
        baseListing.year = year;
        baseListing.mileage = mileage;
        baseListing.transmission = transmission;
      } else if (mainCategory === 'electronics' || mainCategory === 'others') {
        baseListing.condition = condition;
        baseListing.brand = brand;
        baseListing.model = model;
      }

      await onSave(baseListing);

      // Reset
      setTitle('');
      setPrice('');
      setPriceTag('');
      setSize('');
      setBrand('');
      setYear('');
      setMileage('');
      setModel('');
      setLocationName('');
      setLat(6.9271);
      setLng(79.8612);
      setImageFiles([]);
      setImagePreviews([]);
      onClose();
    } catch (err) {
      alert('Failed to publish listing: ' + err.message);
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
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 text-left">
            {/* Step 1: Category Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                1. Select Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = mainCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setMainCategory(cat.key)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        isSelected
                          ? 'border-gray-900 bg-gray-900 text-white shadow-sm ring-2 ring-gray-900/20'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-xs font-bold">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Dynamic Category-Specific Fields */}
            <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 space-y-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {CATEGORIES.find((c) => c.key === mainCategory)?.label} Details
              </span>

              {/* REAL ESTATE SPECIFIC */}
              {mainCategory === 'real_estate' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Property Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {PROPERTY_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setPropertyType(t)}
                          className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                            propertyType === t
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Size (Perches / sqft)
                    </label>
                    <input
                      type="text"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="e.g. 15 Perches or 2,200 sqft"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* VEHICLES SPECIFIC */}
              {mainCategory === 'vehicles' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Vehicle Type
                    </label>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                      {VEHICLE_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setVehicleType(t)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                            vehicleType === t
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {t === 'tuk' ? 'Three Wheeler' : t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g. Toyota / Honda"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                      <input
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="e.g. 2021"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Mileage</label>
                      <input
                        type="text"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        placeholder="e.g. 45,000 km"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Transmission</label>
                      <div className="flex gap-1">
                        {TRANSMISSIONS.map((tr) => (
                          <button
                            key={tr}
                            type="button"
                            onClick={() => setTransmission(tr)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                              transmission === tr
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-600'
                            }`}
                          >
                            {tr}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ELECTRONICS & OTHERS SPECIFIC */}
              {(mainCategory === 'electronics' || mainCategory === 'others') && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Item Condition</label>
                    <div className="flex gap-1.5">
                      {CONDITIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCondition(c)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            condition === c
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g. Apple / Samsung"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Model / Specs</label>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. iPhone 15 Pro / 256GB"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Step 3: Shared Listing Details */}
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
                placeholder={
                  mainCategory === 'vehicles'
                    ? 'e.g. Toyota Land Cruiser Prado TX 2021'
                    : mainCategory === 'electronics'
                    ? 'e.g. MacBook Pro 16" M3 Max'
                    : 'e.g. 3-Bedroom Luxury Apartment in Colombo 7'
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Price & Price Badge */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Price (Rs) *
                </label>
                <input
                  type="number"
                  required
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
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                ))}
                {imageFiles.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors bg-gray-50"
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

            {/* Smart Location & Mini-Map Picker */}
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
                    Drag the pin or search your city
                  </span>
                </div>

                <SmartLocationPicker
                  lat={lat}
                  lng={lng}
                  onLocationChange={(newLat, newLng) => {
                    setLat(newLat);
                    setLng(newLng);
                  }}
                  locationName={locationName}
                  onLocationNameChange={(newName) => {
                    setLocationName(newName);
                  }}
                />
              </div>
            </div>

            {/* Phone & Seller Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Contact Phone *
                  </label>
                  {(profile?.phone || phone) && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Pre-filled
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 077 123 4567 or +94771234567"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Seller Role
                </label>
                <div className="flex gap-1">
                  {SELLER_TYPES.map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setSellerType(st.key)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                        sellerType === st.key
                          ? st.key === 'owner'
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
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
                placeholder="Give details about your item or property..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Publishing to Map...' : 'Pin Listing to Map'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
