import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  MapPin,
  Trash2,
  ExternalLink,
  Plus,
  Loader2,
  TrendingUp,
  Pencil,
  Clock,
} from 'lucide-react';
import {
  deleteListing,
  isListingPremiumActive,
  isListingPremiumExpired,
} from '../lib/storage';
import { getOptimizedImageUrl } from '../utils/cloudinary';
import PremiumUpgradeModal, { getPremiumPrice } from './PremiumUpgradeModal';
import EditListingModal from './EditListingModal';

export default function MyListings({
  user,
  listings = [],
  onBack,
  onSelectListing,
  onPostAd,
}) {
  const [localListings, setLocalListings] = useState(listings);
  const [upgradeTarget, setUpgradeTarget] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setLocalListings(listings);
  }, [listings]);

  const uid = user?.id || user?.uid;

  // Filter listings belonging strictly to this user - no dummy fallback arrays
  const userListings = useMemo(() => {
    if (!uid) return [];
    return localListings.filter(
      (l) => l.sellerId === uid || l.seller_id === uid || l.user_id === uid
    );
  }, [localListings, uid]);

  const premiumCount = useMemo(() => {
    return userListings.filter(isListingPremiumActive).length;
  }, [userListings]);

  const handleUpgradeSuccess = (updatedListing) => {
    setLocalListings((prev) =>
      prev.map((l) =>
        l.id === updatedListing.id
          ? { ...l, ...updatedListing }
          : l
      )
    );
  };

  const handleEditSuccess = (updatedListing) => {
    setLocalListings((prev) =>
      prev.map((l) =>
        l.id === updatedListing.id
          ? { ...l, ...updatedListing }
          : l
      )
    );
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(id);
    try {
      await deleteListing(id);
    } catch (err) {
      alert('Failed to delete listing: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-gray-50 flex flex-col overflow-y-auto">
      {/* Top Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs z-20">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                My Ads & Listings
              </h1>
              <p className="text-[11px] text-gray-500">
                Manage your posted listings and boost visibility with Golden Pins
              </p>
            </div>
          </div>

          {onPostAd && (
            <button
              onClick={() => {
                onBack();
                onPostAd();
              }}
              className="flex items-center gap-1.5 bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Post New Ad</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto px-4 py-6 flex-1">
        {/* Stats Highlights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
              📦
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Your Active Ads</p>
              <p className="text-lg font-black text-gray-900">{userListings.length}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-yellow-50/50 p-4 rounded-2xl border border-amber-200/70 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-400 text-slate-950 flex items-center justify-center font-bold text-base shadow-xs">
              ⭐
            </div>
            <div>
              <p className="text-xs text-amber-900 font-medium">Golden Pins Active</p>
              <p className="text-lg font-black text-amber-950">{premiumCount}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Golden Pin Reach</p>
              <p className="text-lg font-black text-emerald-700">10x More Views</p>
            </div>
          </div>
        </div>

        {/* Listing Cards List */}
        {userListings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-gray-200/80 text-center shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 text-2xl">
              📦
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              No Ads Posted Yet
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              You have not posted any listings yet. Post your property, vehicle, or item to reach buyers across Sri Lanka!
            </p>
            {onPostAd && (
              <button
                onClick={() => {
                  onBack();
                  onPostAd();
                }}
                className="inline-flex items-center gap-1.5 bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Post Your First Ad</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {userListings.map((item) => {
            const isExpired = isListingPremiumExpired(item);
            const isPremium = !isExpired && isListingPremiumActive(item);
            const premiumStatus = item.premium_status || item.premiumStatus;
            const isPending = !isPremium && !isExpired && premiumStatus === 'pending';

            const rawThumb =
              item.image_urls?.[0] ||
              item.imageUrls?.[0] ||
              item.imageUrl ||
              '';
            const thumb = getOptimizedImageUrl(rawThumb, 'thumbnail');

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all duration-200 p-4 shadow-xs flex flex-col justify-between gap-2 ${
                  isPremium
                    ? 'border-amber-300 ring-2 ring-amber-400/20 bg-gradient-to-r from-amber-50/30 via-white to-white'
                    : isExpired
                    ? 'border-amber-200 bg-amber-50/30'
                    : isPending
                    ? 'border-yellow-300 bg-yellow-50/30 ring-1 ring-yellow-400/20'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                  {/* Thumbnail & Information */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
                      <img
                        src={thumb}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/100x100?text=Error';
                        }}
                      />
                      {isPremium && (
                        <span className="absolute top-1 left-1 bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
                          ⭐ GOLD
                        </span>
                      )}
                      {isPending && (
                        <span className="absolute top-1 left-1 bg-yellow-300 text-yellow-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          ⏳ PENDING
                        </span>
                      )}
                      {isExpired && (
                        <span className="absolute top-1 left-1 bg-amber-200 text-amber-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          ⚠️ EXPIRED
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {item.mainCategory}
                        </span>
                        {item.subCategory && (
                          <span className="text-[10px] font-semibold text-gray-500 capitalize">
                            • {item.subCategory}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-sm font-black text-emerald-600 mt-0.5">
                        {isPremium && <span className="text-amber-500 mr-1">⭐</span>}
                        Rs. {Number(item.price).toLocaleString()}
                        {item.priceTag && (
                          <span className="text-xs text-gray-400 font-medium ml-1.5">
                            ({item.priceTag})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                        <MapPin size={12} className="shrink-0 text-gray-400" />
                        <span className="truncate">{item.locationName || 'Sri Lanka'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 flex-wrap sm:flex-nowrap">
                    {/* Status Badges & Upgrade Button */}
                    {isPremium ? (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 shadow-sm ring-1 ring-amber-400/50">
                        <span>⭐ Golden Pin Active</span>
                      </div>
                    ) : isPending ? (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-900 border border-yellow-300 shadow-xs cursor-default">
                        <span>⏳ Golden Pin Pending</span>
                      </div>
                    ) : isExpired ? (
                      <button
                        onClick={() => setUpgradeTarget(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:via-amber-500 hover:to-yellow-500 active:scale-95 text-slate-950 shadow-sm hover:shadow transition-all cursor-pointer font-sans"
                      >
                        <Sparkles size={14} className="text-slate-950" />
                        <span>Renew Golden Pin</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setUpgradeTarget(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:via-amber-500 hover:to-yellow-500 active:scale-95 text-slate-950 shadow-sm hover:shadow transition-all cursor-pointer font-sans"
                      >
                        <Sparkles size={14} className="text-slate-950" />
                        <span>Upgrade to Premium</span>
                      </button>
                    )}

                    {/* View on Map */}
                    {onSelectListing && (
                      <button
                        onClick={() => {
                          onBack();
                          onSelectListing(item);
                        }}
                      className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                      title="View on Map"
                    >
                      <ExternalLink size={16} />
                    </button>
                  )}

                  {/* Edit */}
                  <button
                    onClick={() => setEditingListing(item)}
                    className="p-2 rounded-xl border border-blue-100 text-blue-600 hover:text-blue-800 hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
                    title="Edit listing"
                  >
                    <Pencil size={16} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    disabled={deletingId === item.id}
                    className="p-2 rounded-xl border border-red-100 text-red-500 hover:text-red-700 hover:bg-red-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    title="Delete listing"
                  >
                    {deletingId === item.id ? (
                      <Loader2 size={16} className="animate-spin text-red-500" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Expired Golden Pin Alert Banner */}
              {isExpired && (
                <div className="w-full mt-1 p-3 rounded-xl bg-amber-100/90 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-950 font-bold">
                    <span>⚠️ Your Golden Pin has expired! Renew your Golden Pin and stay on top to get the right sale.</span>
                  </div>
                  <button
                    onClick={() => setUpgradeTarget(item)}
                    className="shrink-0 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 active:scale-95 text-slate-950 font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={13} className="text-slate-950" />
                    <span>Renew Golden Pin</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
          </div>
        )}
      </main>

      {/* Dynamic Pricing Premium Upgrade Modal */}
      <PremiumUpgradeModal
        open={Boolean(upgradeTarget)}
        listing={upgradeTarget}
        onClose={() => setUpgradeTarget(null)}
        onUpgradeSuccess={handleUpgradeSuccess}
      />

      {/* Edit Listing Modal */}
      {editingListing && (
        <EditListingModal
          open={Boolean(editingListing)}
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onSave={handleEditSuccess}
        />
      )}
    </div>
  );
}
