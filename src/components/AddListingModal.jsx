import { useState, useRef, useEffect } from 'react';
import { X, MapPin, ImagePlus, Loader2, Trash2, ChevronDown } from 'lucide-react';
import { uploadImages } from '../lib/uploadImage';
import { getProfile } from '../lib/auth';
import SmartLocationPicker from './SmartLocationPicker';

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

export default function AddListingModal({
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

      const baseListing = {
        mainCategory,
        subCategory: activeSubCategory,
        sub_category: activeSubCategory,
        propertyType: mainCategory === 'real_estate' ? activeSubCategory : '',
        vehicleType: mainCategory === 'vehicles' ? activeSubCategory : '',
        brand: effectiveBrand,
        model: model || '',
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
        isPremium: false,
        is_premium: false,
      };

      // Add category specific attributes
      if (mainCategory === 'real_estate') {
        baseListing.size = size;
      } else if (mainCategory === 'vehicles') {
        baseListing.year = year;
        baseListing.mileage = mileage;
        baseListing.transmission = transmission;
      } else if (mainCategory === 'electronics' || mainCategory === 'others') {
        baseListing.condition = condition;
      }

      await onSave(baseListing);

      // Reset
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
            {/* Step 1: Cascading First Dropdown: Main Category */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                1. Main Category *
              </label>
              <div className="relative">
                <select
                  value={mainCategory}
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white appearance-none cursor-pointer"
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

            {/* Step 2: Dynamic Cascading Sub-Category Dropdowns */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                {MAIN_CATEGORIES.find((c) => c.key === mainCategory)?.label} Specifications
              </span>

              {/* REAL ESTATE SPECIFIC */}
              {mainCategory === 'real_estate' && (
                <>
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
                      Land / Property Size
                    </label>
                    <input
                      type="text"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="e.g. 15 Perches or 2,200 sqft"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* VEHICLES SPECIFIC */}
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">Transmission</label>
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

              {/* ELECTRONICS SPECIFIC */}
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Brand *
                      </label>
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

                  {brand === 'Other' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Custom Brand Name</label>
                      <input
                        type="text"
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        placeholder="Enter brand name"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Model / Specs *</label>
                      <input
                        type="text"
                        required
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. iPhone 15 Pro, Galaxy S24..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Item Condition</label>
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

              {/* SERVICES SPECIFIC */}
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

              {/* OTHERS SPECIFIC */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Brand / Maker</label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g. Singer, Damro..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Model / Specs</label>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. 4-Chairs Teak Dining Set"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
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
