import { useState, useMemo, useEffect } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  User,
  Navigation,
  Calculator,
  ChevronDown,
  ChevronUp,
  Percent,
  Calendar,
  DollarSign,
  Handshake,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import ImageCarousel from './ImageCarousel';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getProfile } from '../lib/auth';

const CATEGORY_META = {
  real_estate: { label: 'Real Estate', icon: '🏠', badge: 'bg-emerald-50 text-emerald-800' },
  vehicles: { label: 'Vehicles', icon: '🚗', badge: 'bg-violet-50 text-violet-800' },
  electronics: { label: 'Electronics', icon: '📱', badge: 'bg-sky-50 text-sky-800' },
  others: { label: 'Others', icon: '📦', badge: 'bg-amber-50 text-amber-800' },
};

const SELLER_COLORS = {
  owner: 'bg-green-100 text-green-800',
  broker: 'bg-blue-100 text-blue-800',
  dealer: 'bg-blue-100 text-blue-800',
};

const DURATION_OPTIONS = [3, 5, 10, 15, 20];

/**
 * Parses listing size and calculates unit price (per perch or per sqft)
 */
function getSmartPriceMetric(listing) {
  if (listing.mainCategory !== 'real_estate' || !listing.price || !listing.size) {
    return null;
  }

  const price = Number(listing.price);
  if (isNaN(price) || price <= 0) return null;

  const sizeStr = String(listing.size).toLowerCase();
  const propType = String(listing.propertyType || '').toLowerCase();

  // 1. Land: Per perch calculation
  if (propType === 'land' || sizeStr.includes('perch')) {
    const match = sizeStr.match(/([\d,.]+)/);
    if (match) {
      const perches = parseFloat(match[1].replace(/,/g, ''));
      if (perches > 0) {
        const perPerch = Math.round(price / perches);
        return {
          label: `Rs. ${perPerch.toLocaleString()} per perch`,
          type: 'perch',
        };
      }
    }
  }

  // 2. House / Apartment / Commercial: Price per sqft
  if (
    sizeStr.includes('sqft') ||
    sizeStr.includes('sq ft') ||
    sizeStr.includes('sq.ft') ||
    sizeStr.includes('square')
  ) {
    const match = sizeStr.match(/([\d,.]+)/);
    if (match) {
      const sqft = parseFloat(match[1].replace(/,/g, ''));
      if (sqft > 0) {
        const perSqft = Math.round(price / sqft);
        return {
          label: `Rs. ${perSqft.toLocaleString()} per sqft`,
          type: 'sqft',
        };
      }
    }
  }

  return null;
}

/**
 * Financial / Loan / Lease Calculator Component
 */
function FinancialCalculator({ listing }) {
  const defaultYears = listing.mainCategory === 'real_estate' ? 20 : 5;
  const totalPrice = Number(listing.price) || 0;

  const [isOpen, setIsOpen] = useState(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [durationYears, setDurationYears] = useState(defaultYears);
  const [interestRate, setInterestRate] = useState(12);

  // Sync default duration if listing changes
  useEffect(() => {
    setDurationYears(listing.mainCategory === 'real_estate' ? 20 : 5);
    setDownPaymentPercent(20);
    setInterestRate(12);
  }, [listing.id, listing.mainCategory]);

  const downPaymentAmount = Math.round(totalPrice * (downPaymentPercent / 100));
  const principal = Math.max(0, totalPrice - downPaymentAmount);

  // Amortization calculation: M = P [ i(1 + i)^n ] / [ (1 + i)^n - 1]
  const calculation = useMemo(() => {
    const n = durationYears * 12; // total monthly periods
    const i = interestRate / 100 / 12; // monthly interest rate

    let monthly = 0;
    if (principal > 0 && n > 0) {
      if (i > 0) {
        const factor = Math.pow(1 + i, n);
        monthly = Math.round((principal * (i * factor)) / (factor - 1));
      } else {
        monthly = Math.round(principal / n);
      }
    }

    const totalRepayment = monthly * n;
    const totalInterest = Math.max(0, totalRepayment - principal);

    return {
      monthly,
      totalRepayment,
      totalInterest,
    };
  }, [principal, durationYears, interestRate]);

  if (totalPrice <= 0) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/30">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-blue-100/40"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Calculator size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">
              {listing.mainCategory === 'vehicles'
                ? 'Lease & Loan Calculator'
                : 'Mortgage & Loan Calculator'}
            </h4>
            <p className="text-[11px] font-medium text-gray-500">
              Est. ~<span className="font-bold text-blue-700">Rs. {calculation.monthly.toLocaleString()}</span> / mo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
          <span>{isOpen ? 'Close' : 'Customize'}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded Calculator Form */}
      {isOpen && (
        <div className="space-y-4 border-t border-blue-100/80 p-4 pt-3">
          {/* Result Card */}
          <div className="rounded-xl border border-blue-200/80 bg-white p-3.5 shadow-xs text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Estimated Monthly Installment
            </p>
            <p className="mt-0.5 text-2xl font-black text-blue-600">
              Rs. {calculation.monthly.toLocaleString()}
              <span className="text-xs font-normal text-gray-500"> / month</span>
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 border-t border-gray-100 pt-2 text-[11px] text-gray-500">
              <span>
                Loan: <strong className="text-gray-800">Rs. {principal.toLocaleString()}</strong>
              </span>
              <span>•</span>
              <span>
                Interest: <strong className="text-gray-800">Rs. {calculation.totalInterest.toLocaleString()}</strong>
              </span>
            </div>
          </div>

          {/* 1. Total Price Display */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-600">Total Price:</span>
            <span className="font-bold text-gray-900">Rs. {totalPrice.toLocaleString()}</span>
          </div>

          {/* 2. Down Payment Slider */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">Down Payment</span>
              <span className="font-bold text-gray-900">
                {downPaymentPercent}%{' '}
                <span className="text-[11px] font-normal text-gray-500">
                  (Rs. {downPaymentAmount.toLocaleString()})
                </span>
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-blue-100 accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>0%</span>
              <span>40%</span>
              <span>80%</span>
            </div>
          </div>

          {/* 3. Duration & Interest Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Duration (Years)
              </label>
              <select
                value={durationYears}
                onChange={(e) => setDurationYears(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DURATION_OPTIONS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} Years ({yr * 12} mos)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Interest Rate (% p.a.)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="40"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-3 pr-7 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Percent
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 leading-tight">
            *Standard amortization calculation for estimation purposes only. Exact loan terms and rates depend on lender requirements.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ListingDetailSheet({
  listing,
  onClose,
  onViewSeller,
  user,
  profile,
}) {
  if (!listing) return null;

  const phone = listing.sellerPhone || listing.phone || '';
  const waText = encodeURIComponent(
    `Hi, I'm interested in "${listing.title}" on PinLanka`
  );
  const waLink = `https://wa.me/${phone}?text=${waText}`;
  const callLink = `tel:${phone}`;

  // Seller type check
  const sellerType = (listing.sellerType || listing.seller_type || 'owner').toLowerCase();
  const isBroker = sellerType === 'broker';

  // State for Broker Introduction Agreement Modal (Digital Handshake)
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [pendingContactMethod, setPendingContactMethod] = useState(null); // 'whatsapp' | 'call'
  const [buyerPhone, setBuyerPhone] = useState(
    profile?.phone || user?.user_metadata?.phone || user?.phone || ''
  );
  const [phoneError, setPhoneError] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // Auto-fill phone when profile or user details become available
  useEffect(() => {
    const defaultPhone = profile?.phone || user?.user_metadata?.phone || user?.phone || '';
    if (defaultPhone && !buyerPhone) {
      setBuyerPhone(defaultPhone);
    }
  }, [profile, user]);

  // Reset modal state on listing change
  useEffect(() => {
    setShowBrokerModal(false);
    setPendingContactMethod(null);
    setPhoneError('');
    setSubmittingInquiry(false);
  }, [listing?.id]);

  // Fetch seller profile for avatar and bio
  const [sellerProfile, setSellerProfile] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const sellerId = listing?.sellerId || listing?.user_id;
    if (sellerId) {
      getProfile(sellerId).then((prof) => {
        if (!cancelled && prof) {
          setSellerProfile(prof);
        }
      });
    } else {
      setSellerProfile(null);
    }
    return () => {
      cancelled = true;
    };
  }, [listing?.sellerId, listing?.user_id, listing?.id]);

  // Log inquiry to Supabase
  const logInquiry = async (method, inputPhone) => {
    try {
      if (isSupabaseConfigured && supabase) {
        const brokerId = isBroker ? (listing.user_id || listing.sellerId || null) : null;
        const payload = {
          property_id: listing.id,
          broker_id: brokerId,
          buyer_phone: inputPhone || null,
          contact_method: method, // 'whatsapp' | 'call'
        };

        const { error } = await supabase.from('inquiries').insert([payload]);
        if (error) {
          console.warn('Supabase inquiry insert note:', error.message);
        }
      }
    } catch (err) {
      console.warn('Failed to log inquiry to Supabase, continuing:', err);
    }
  };

  const executeContact = (method) => {
    if (method === 'whatsapp') {
      window.open(waLink, '_blank', 'noopener,noreferrer');
    } else if (method === 'call') {
      window.location.href = callLink;
    }
  };

  const handleContactClick = async (method) => {
    if (isBroker) {
      // IF seller_type === 'broker': Do NOT redirect immediately.
      // Instead, open a small confirmation modal over the sheet.
      setPendingContactMethod(method);
      setShowBrokerModal(true);
    } else {
      // IF seller_type === 'owner':
      // Do not show any modal. Just redirect them directly to WhatsApp or the Phone dialer.
      const currentBuyerPhone = buyerPhone || profile?.phone || user?.user_metadata?.phone || user?.phone || '';
      await logInquiry(method, currentBuyerPhone);
      executeContact(method);
    }
  };

  const handleAgreeAndContact = async (e) => {
    if (e) e.preventDefault();
    if (!buyerPhone.trim()) {
      setPhoneError('Please enter your phone number.');
      return;
    }

    setSubmittingInquiry(true);
    try {
      // 1. Log inquiry to Supabase
      await logInquiry(pendingContactMethod, buyerPhone.trim());
      // 2. Close modal
      setShowBrokerModal(false);
      // 3. Proceed to contact
      executeContact(pendingContactMethod);
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handleDirections = () => {
    const lat = parseFloat(listing.lat);
    const lng = parseFloat(listing.lng);
    let url;
    if (!isNaN(lat) && !isNaN(lng)) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    } else if (listing.locationName) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.locationName)}`;
    }
    if (url) {
      window.open(url, '_blank');
    }
  };

  const catMeta = CATEGORY_META[listing.mainCategory] || CATEGORY_META.others;
  const smartMetric = getSmartPriceMetric(listing);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[2000] transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[2001] bg-white rounded-t-3xl shadow-2xl max-h-[88vh] overflow-y-auto animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-6">
          {/* Image carousel */}
          <ImageCarousel images={listing.imageUrls} />

          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${catMeta.badge}`}
                >
                  <span>{catMeta.icon}</span>
                  <span>{catMeta.label}</span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                    SELLER_COLORS[listing.sellerType] || SELLER_COLORS.owner
                  }`}
                >
                  {listing.sellerType || 'owner'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-snug">
                {listing.title}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <span>📍</span>
                <span>{listing.locationName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Price & Smart Price Metrics */}
          <div className="flex flex-wrap items-baseline gap-2.5 mb-4">
            <span className="text-2xl font-black text-gray-950">
              Rs {listing.price?.toLocaleString()}
            </span>
            {smartMetric && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                <span>⚡</span>
                <span>{smartMetric.label}</span>
              </span>
            )}
          </div>

          {/* Dynamic Specs Section based on mainCategory */}
          {listing.mainCategory === 'vehicles' && (
            <div className="bg-gray-50 rounded-2xl p-3.5 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {listing.year && (
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Year</p>
                  <p className="text-sm font-extrabold text-gray-800">{listing.year}</p>
                </div>
              )}
              {listing.mileage && (
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Mileage</p>
                  <p className="text-sm font-extrabold text-gray-800">{listing.mileage}</p>
                </div>
              )}
              {listing.transmission && (
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Transmission</p>
                  <p className="text-sm font-extrabold text-gray-800">{listing.transmission}</p>
                </div>
              )}
              {(listing.brand || listing.vehicleType) && (
                <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Type / Brand</p>
                  <p className="text-sm font-extrabold text-gray-800 capitalize truncate">
                    {listing.brand ? `${listing.brand}` : listing.vehicleType}
                  </p>
                </div>
              )}
            </div>
          )}

          {listing.mainCategory === 'real_estate' && (
            <div className="bg-gray-50 rounded-2xl p-3.5 mb-4 flex flex-wrap gap-2">
              {listing.propertyType && (
                <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-400 font-semibold mr-1">Type:</span>
                  <span className="text-xs font-bold text-gray-800 capitalize">{listing.propertyType}</span>
                </div>
              )}
              {listing.size && (
                <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-400 font-semibold mr-1">Size:</span>
                  <span className="text-xs font-bold text-gray-800">{listing.size}</span>
                </div>
              )}
            </div>
          )}

          {(listing.mainCategory === 'electronics' || listing.mainCategory === 'others') && (
            <div className="bg-gray-50 rounded-2xl p-3.5 mb-4 flex flex-wrap gap-2">
              {listing.condition && (
                <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-400 font-semibold mr-1">Condition:</span>
                  <span className="text-xs font-bold text-emerald-700">{listing.condition}</span>
                </div>
              )}
              {listing.brand && (
                <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-400 font-semibold mr-1">Brand:</span>
                  <span className="text-xs font-bold text-gray-800">{listing.brand}</span>
                </div>
              )}
              {listing.model && (
                <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-400 font-semibold mr-1">Model:</span>
                  <span className="text-xs font-bold text-gray-800">{listing.model}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Description
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          )}

          {/* Financial / Loan / Lease Calculator Section */}
          <FinancialCalculator listing={listing} />

          {/* Seller info card with Avatar & Bio */}
          {listing.sellerName && (() => {
            const sellerAvatar =
              sellerProfile?.avatar_url ||
              sellerProfile?.avatarUrl ||
              listing.sellerAvatar ||
              listing.seller_avatar ||
              '';
            const sellerBio =
              sellerProfile?.bio ||
              listing.sellerBio ||
              listing.seller_bio ||
              '';
            const sellerDisplayName = sellerProfile?.name || listing.sellerName;

            return (
              <div className="bg-gray-50 rounded-2xl p-3.5 mb-4 border border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {sellerAvatar ? (
                      <img
                        src={sellerAvatar}
                        alt={sellerDisplayName}
                        className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/20 shadow-xs"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-base font-bold shrink-0 shadow-xs">
                        {sellerDisplayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-1.5">
                        <span>{sellerDisplayName}</span>
                        {listing.sellerType === 'broker' && listing.isVerified && (
                          <span
                            title="Verified Broker"
                            className="inline-flex items-center gap-0.5 text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full"
                          >
                            <span>🛡️</span>
                            <span>Verified</span>
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {sellerProfile?.company || listing.sellerType || 'Seller'}
                      </p>
                    </div>
                  </div>

                  {listing.sellerId && onViewSeller && (
                    <button
                      onClick={() => onViewSeller(listing.sellerId)}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 shrink-0 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <User size={14} />
                      <span>View Profile</span>
                    </button>
                  )}
                </div>

                {/* Seller Bio */}
                {sellerBio && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-200/60">
                    <p className="text-xs text-gray-600 italic leading-relaxed">
                      &ldquo;{sellerBio}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Action buttons: WhatsApp, Call, Directions */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleContactClick('whatsapp')}
              className="min-h-[46px] flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold py-3 px-2 rounded-xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
            >
              <MessageCircle size={18} className="shrink-0" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => handleContactClick('call')}
              className="min-h-[46px] flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3 px-2 rounded-xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
            >
              <Phone size={18} className="shrink-0" />
              <span>Call</span>
            </button>
            <button
              type="button"
              onClick={handleDirections}
              className="min-h-[46px] flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 active:scale-[0.98] text-white font-bold py-3 px-2 rounded-xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
            >
              <Navigation size={18} className="shrink-0" />
              <span>Directions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Broker Introduction Agreement Modal (Digital Handshake) */}
      {showBrokerModal && isBroker && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[3000] transition-opacity"
            onClick={() => !submittingInquiry && setShowBrokerModal(false)}
          />
          <div className="fixed inset-0 z-[3001] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto animate-scale-in">
              {/* Header */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                    <Handshake size={24} />
                  </div>
                  <button
                    type="button"
                    onClick={() => !submittingInquiry && setShowBrokerModal(false)}
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100 uppercase tracking-wider mb-1.5">
                    <ShieldCheck size={12} className="text-blue-600" />
                    <span>Digital Handshake</span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 leading-snug">
                    Broker Introduction Agreement
                  </h3>
                </div>
              </div>

              {/* Agreement Text */}
              <div className="px-5 py-2">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  You are about to contact a professional broker. By proceeding, you acknowledge that this broker introduced you to this property and standard commission agreements may apply.
                </div>

                {/* Broker & Listing Pill */}
                <div className="mt-3 flex items-center gap-2.5 bg-gray-50/80 border border-gray-100 rounded-xl px-3 py-2 text-xs">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {listing.sellerName ? listing.sellerName.charAt(0).toUpperCase() : 'B'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 truncate">
                      {listing.sellerName || 'Professional Broker'}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {listing.title}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full shrink-0">
                    Broker
                  </span>
                </div>

                {/* Input Field: Your Phone Number */}
                <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Your Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => {
                        setBuyerPhone(e.target.value);
                        if (phoneError) setPhoneError('');
                      }}
                      placeholder="e.g. 077 123 4567"
                      className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border ${
                        phoneError
                          ? 'border-red-400 focus:ring-red-200'
                          : 'border-gray-200 focus:ring-blue-100 focus:border-blue-500'
                      } rounded-xl text-sm font-semibold text-gray-900 outline-none transition-all focus:ring-4`}
                      autoFocus
                    />
                  </div>
                  {phoneError ? (
                    <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{phoneError}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-400 mt-1">
                      Required so the broker knows who agreed to this introduction.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons: [Cancel] and [Agree & Contact] */}
              <div className="p-5 pt-3 bg-gray-50/50 border-t border-gray-100 mt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => !submittingInquiry && setShowBrokerModal(false)}
                  disabled={submittingInquiry}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAgreeAndContact}
                  disabled={submittingInquiry}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {submittingInquiry ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      {pendingContactMethod === 'whatsapp' ? (
                        <MessageCircle size={16} />
                      ) : (
                        <Phone size={16} />
                      )}
                      <span>Agree & Contact</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
