import { useState, useRef, useEffect } from 'react';
import {
  X,
  MapPin,
  ImagePlus,
  Loader2,
  Trash2,
  Save,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateListing } from '../lib/storage';
import { uploadImages } from '../lib/uploadImage';
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

export default function EditListingModal({
  open,
  listing,
  onClose,
  onSave,
}) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Form states initialized from listing
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [priceTag, setPriceTag] = useState('');
  const [mainCategory, setMainCategory] = useState('real_estate');
  const [subCategory, setSubCategory] = useState('');
  const [propertyType, setPropertyType] = useState('land');
  const [vehicleType, setVehicleType] = useState('car');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [size, setSize] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [transmission, setTransmission] = useState('Automatic');
  const [condition, setCondition] = useState('Used');
  const [description, setDescription] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerType, setSellerType] = useState('owner');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState(6.9271);
  const [lng, setLng] = useState(79.8612);

  // Images state
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  useEffect(() => {
    if (listing && open) {
      setTitle(listing.title || '');
      setPrice(listing.price != null ? String(listing.price) : '');
      setPriceTag(listing.priceTag || '');
      setMainCategory(listing.mainCategory || listing.main_category || 'real_estate');
      setSubCategory(listing.subCategory || listing.sub_category || '');
      setPropertyType(listing.propertyType || listing.property_type || 'land');
      setVehicleType(listing.vehicleType || listing.vehicle_type || 'car');
      setBrand(listing.brand || '');
      setModel(listing.model || '');
      setSize(listing.size || '');
      setYear(listing.year ? String(listing.year) : '');
      setMileage(listing.mileage || '');
      setTransmission(listing.transmission || 'Automatic');
      setCondition(listing.condition || 'Used');
      setDescription(listing.description || '');
      setSellerPhone(listing.sellerPhone || listing.seller_phone || listing.phone || '');
      setSellerType(listing.sellerType || listing.seller_type || 'owner');
      setLocationName(listing.locationName || listing.location_name || '');
      setLat(listing.lat ? parseFloat(listing.lat) : 6.9271);
      setLng(listing.lng ? parseFloat(listing.lng) : 79.8612);

      const imgs = listing.imageUrls || (listing.imageUrl ? [listing.imageUrl] : []);
      setExistingImages(imgs);
      setNewImageFiles([]);
      setNewImagePreviews([]);
    }
  }, [listing, open]);

  if (!open || !listing) return null;

  const handlePriceChange = (e) => {
    const val = e.target.value;
    setPrice(val);
    if (!priceTag || priceTag === generateDefaultPriceTag(price)) {
      setPriceTag(generateDefaultPriceTag(val));
    }
  };

  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setNewImageFiles((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveExistingImage = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveNewImage = (idx) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a listing title.');
      return;
    }
    if (!price || isNaN(Number(price))) {
      toast.error('Please enter a valid price.');
      return;
    }

    setLoading(true);
    try {
      let finalImages = [...existingImages];

      // Upload newly added images if any
      if (newImageFiles.length > 0) {
        toast.loading('Uploading new images...', { id: 'edit-upload' });
        const uploaded = await uploadImages(newImageFiles);
        finalImages = [...finalImages, ...uploaded];
        toast.dismiss('edit-upload');
      }

      const updates = {
        title: title.trim(),
        price: Number(price),
        price_tag: priceTag || generateDefaultPriceTag(price),
        priceTag: priceTag || generateDefaultPriceTag(price),
        main_category: mainCategory,
        mainCategory: mainCategory,
        sub_category: subCategory || null,
        subCategory: subCategory || null,
        property_type: mainCategory === 'real_estate' ? propertyType : null,
        propertyType: mainCategory === 'real_estate' ? propertyType : null,
        vehicle_type: mainCategory === 'vehicles' ? vehicleType : null,
        vehicleType: mainCategory === 'vehicles' ? vehicleType : null,
        brand: brand ? brand.trim() : null,
        model: model ? model.trim() : null,
        size: size ? size.trim() : null,
        year: year ? year.trim() : null,
        mileage: mileage ? mileage.trim() : null,
        transmission: mainCategory === 'vehicles' ? transmission : null,
        condition: (mainCategory === 'electronics' || mainCategory === 'others') ? condition : null,
        description: description.trim(),
        seller_phone: sellerPhone.trim(),
        sellerPhone: sellerPhone.trim(),
        seller_type: sellerType,
        sellerType: sellerType,
        location_name: locationName.trim(),
        locationName: locationName.trim(),
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        image_urls: finalImages,
        imageUrls: finalImages,
      };

      const saved = await updateListing(listing.id, updates);

      toast.success('Listing updated successfully!');
      if (onSave) {
        onSave(saved || { ...listing, ...updates });
      }
      onClose();
    } catch (err) {
      console.error('Failed to update listing:', err);
      toast.error('Failed to update listing: ' + (err.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[5500] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => !loading && onClose()}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/70">
          <div>
            <h2 className="text-lg font-black text-gray-900">Edit Listing</h2>
            <p className="text-xs text-gray-500">Update ad information, pricing, photos, and location</p>
          </div>
          <button
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault();
            }
          }}
          className="p-5 overflow-y-auto space-y-4"
        >
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 3 Bedroom Luxury Apartment in Colombo 03"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Price & PriceTag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Price (Rs) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={handlePriceChange}
                placeholder="e.g. 45000000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Map Price Tag (e.g. 45M / 250k)
              </label>
              <input
                type="text"
                value={priceTag}
                onChange={(e) => setPriceTag(e.target.value)}
                placeholder="e.g. 45M"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Main Category */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Main Category
            </label>
            <div className="relative">
              <select
                value={mainCategory}
                onChange={(e) => setMainCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
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

          {/* Conditional Sub-categories */}
          {mainCategory === 'real_estate' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-1">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 text-xs font-semibold text-gray-900 bg-white"
                >
                  {REAL_ESTATE_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-1">
                  Size (e.g. 15 perches / 2200 sqft)
                </label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. 15 perches"
                  className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 text-xs font-semibold text-gray-900 bg-white"
                />
              </div>
            </div>
          )}

          {mainCategory === 'vehicles' && (
            <div className="space-y-3 p-3 bg-violet-50/50 rounded-2xl border border-violet-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-violet-900 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-violet-200 text-xs font-semibold text-gray-900 bg-white"
                  >
                    {VEHICLE_TYPES.map((vt) => (
                      <option key={vt.key} value={vt.key}>{vt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-violet-900 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    list="vehicle-brands"
                    placeholder="e.g. Toyota"
                    className="w-full px-3 py-2 rounded-xl border border-violet-200 text-xs font-semibold text-gray-900 bg-white"
                  />
                  <datalist id="vehicle-brands">
                    {VEHICLE_BRANDS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-violet-900 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Premio / Vitz"
                    className="w-full px-3 py-2 rounded-xl border border-violet-200 text-xs font-semibold text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-violet-900 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2018"
                    className="w-full px-3 py-2 rounded-xl border border-violet-200 text-xs font-semibold text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-violet-900 mb-1">
                    Mileage
                  </label>
                  <input
                    type="text"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="45,000 km"
                    className="w-full px-3 py-2 rounded-xl border border-violet-200 text-xs font-semibold text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-violet-900 mb-1">
                    Transmission
                  </label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-violet-200 text-xs font-semibold text-gray-900 bg-white"
                  >
                    {TRANSMISSIONS.map((tr) => (
                      <option key={tr} value={tr}>{tr}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {mainCategory === 'electronics' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-sky-50/50 rounded-2xl border border-sky-100">
              <div>
                <label className="block text-xs font-bold text-sky-900 mb-1">Type</label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-sky-200 text-xs font-semibold text-gray-900 bg-white"
                >
                  {ELECTRONICS_TYPES.map((et) => (
                    <option key={et.key} value={et.key}>{et.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-sky-900 mb-1">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  list="electronics-brands"
                  placeholder="e.g. Apple"
                  className="w-full px-3 py-2 rounded-xl border border-sky-200 text-xs font-semibold text-gray-900 bg-white"
                />
                <datalist id="electronics-brands">
                  {ELECTRONICS_BRANDS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-bold text-sky-900 mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-sky-200 text-xs font-semibold text-gray-900 bg-white"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide key details about this listing..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Seller Phone & Seller Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Contact Phone Number
              </label>
              <input
                type="tel"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                placeholder="e.g. 077 123 4567"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Seller Type
              </label>
              <select
                value={sellerType}
                onChange={(e) => setSellerType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {SELLER_TYPES.map((st) => (
                  <option key={st.key} value={st.key}>{st.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location Name & Smart Map Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Location / Area Name
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Havelock Town, Colombo 05"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none mb-3"
            />

            {/* Smart Mini Map with Draggable Pin */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden p-3 bg-gray-50/50">
              <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <MapPin size={14} className="text-blue-600" />
                <span>Adjust Pin Location on Map</span>
              </p>
              <SmartLocationPicker
                lat={lat}
                lng={lng}
                onLocationChange={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                }}
                locationName={locationName}
                onLocationNameChange={(name) => {
                  if (!locationName) setLocationName(name);
                }}
              />
            </div>
          </div>

          {/* Photos Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-700">
                Photos ({existingImages.length + newImageFiles.length})
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <ImagePlus size={14} />
                <span>Add More Photos</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleAddPhotos}
              className="hidden"
            />

            {/* Photo Thumbnails */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {/* Existing Images */}
              {existingImages.map((url, idx) => (
                <div
                  key={`existing-${idx}`}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-gray-100"
                >
                  <img
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white hover:bg-red-700 transition-colors cursor-pointer shadow-xs"
                    title="Remove image"
                  >
                    <Trash2 size={12} />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">
                    Existing
                  </span>
                </div>
              ))}

              {/* New Image Previews */}
              {newImagePreviews.map((preview, idx) => (
                <div
                  key={`new-${idx}`}
                  className="relative aspect-square rounded-xl overflow-hidden border-2 border-emerald-400 group bg-emerald-50"
                >
                  <img
                    src={preview}
                    alt="New preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white hover:bg-red-700 transition-colors cursor-pointer shadow-xs"
                    title="Remove new image"
                  >
                    <Trash2 size={12} />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-emerald-700 text-white text-[9px] px-1 rounded font-bold">
                    New
                  </span>
                </div>
              ))}

              {/* Add Tile Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <ImagePlus size={20} />
                <span className="text-[10px] font-bold mt-1">Upload</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
