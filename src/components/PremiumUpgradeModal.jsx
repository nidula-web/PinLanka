import { useState } from 'react';
import {
  X,
  MapPin,
  Sparkles,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { updateListing } from '../lib/storage';

/**
 * Dynamic pricing helper function:
 * - If mainCategory is exactly 'Real Estate', return 4999
 * - If mainCategory is exactly 'Vehicles', return 2999
 * - For any other category, return 999
 */
export function getPremiumPrice(mainCategory) {
  if (mainCategory === 'Real Estate' || mainCategory === 'real_estate') {
    return 4999;
  }
  if (mainCategory === 'Vehicles' || mainCategory === 'vehicles') {
    return 2999;
  }
  return 999;
}

export default function PremiumUpgradeModal({
  open,
  listing,
  onClose,
  onUpgradeSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  if (!open || !listing) return null;

  const price = getPremiumPrice(listing.mainCategory);

  const handleSimulatePayment = async () => {
    setLoading(true);
    setStatusText('Redirecting to Payment Gateway (PayHere)...');

    try {
      // 1. Show loading spinner for 1.5s to mock payment gateway redirect
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 2. Update is_premium to true in Supabase listings table & local state
      setStatusText('Activating Golden Pin on Map...');
      const updated = await updateListing(listing.id, {
        isPremium: true,
        is_premium: true,
      });

      // 3. Show success toast notification
      toast.success(
        `🌟 "${listing.title}" upgraded to Golden Pin! Now shining at the top of the map.`,
        {
          duration: 4000,
          icon: '⭐',
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #fbbf24',
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: '600',
          },
        }
      );

      // 4. Notify parent to refresh / update
      if (onUpgradeSuccess) {
        onUpgradeSuccess(updated || { ...listing, isPremium: true, is_premium: true });
      }

      // 5. Close modal
      onClose();
    } catch (err) {
      console.error('Upgrade failed:', err);
      toast.error('Payment simulation failed: ' + (err.message || 'Please try again.'));
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
      <Toaster position="top-right" />

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => !loading && onClose()}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-amber-200/90 overflow-hidden z-10 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Gold Gradient Top Banner Header */}
        <div className="h-3.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-xs" />

        <div className="p-6 sm:p-7">
          {/* Close Button */}
          <button
            onClick={() => !loading && onClose()}
            disabled={loading}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 cursor-pointer"
            title="Close modal"
          >
            <X size={18} />
          </button>

          {/* Glowing Gold Map Pin Icon */}
          <div className="relative mx-auto my-2 w-20 h-20 flex items-center justify-center">
            {/* Glowing gold pulse aura */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 blur-lg opacity-70 animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-amber-950 flex items-center justify-center shadow-xl ring-4 ring-amber-100">
              <MapPin size={32} className="fill-amber-950 text-amber-950 drop-shadow-sm" />
            </div>
            <span className="absolute -top-1 -right-1 text-xl animate-bounce">⭐</span>
          </div>

          {/* Title & Enticing Pitch Message */}
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1">
            Stand out with a Golden Pin!
          </h2>
          <p className="text-xs text-gray-500 mt-1 line-clamp-1 font-medium px-2">
            Boost visibility for <span className="font-bold text-gray-800">"{listing.title}"</span>
          </p>

          {/* Dynamic Pricing Box */}
          <div className="my-5 p-4 bg-gradient-to-b from-amber-50 to-yellow-50/50 border border-amber-200/90 rounded-2xl shadow-xs">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
              Special Placement
            </span>
            <div className="text-3xl font-black text-amber-950 tracking-tight flex items-baseline justify-center gap-1.5">
              <span>Rs. {price.toLocaleString()}</span>
              <span className="text-sm font-bold text-amber-800">/ 7 days</span>
            </div>
            <p className="text-[11px] text-amber-800/80 mt-1">
              Customized rate for{' '}
              <strong className="capitalize">
                {String(listing.mainCategory || '').replace('_', ' ')}
              </strong>
            </p>
          </div>

          {/* Benefits List */}
          <div className="text-left space-y-2.5 mb-6 px-1 text-xs text-gray-700 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
            <div className="flex items-start gap-2.5">
              <span className="text-base text-amber-500 shrink-0">🔝</span>
              <span className="font-medium text-gray-800">
                <strong>Appears at the top of the map map with top z-index</strong> (Priority #4999)
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-base text-amber-500 shrink-0">✨</span>
              <span className="font-medium text-gray-800">
                <strong>Glowing Gold Marker</strong> with dynamic pulsing animation aura
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-base text-amber-500 shrink-0">🚀</span>
              <span className="font-medium text-gray-800">
                <strong>More views and leads</strong> from active buyers in Sri Lanka
              </span>
            </div>
          </div>

          {/* Status feedback when loading */}
          {loading && statusText && (
            <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center justify-center gap-2 animate-in fade-in duration-150">
              <Loader2 size={16} className="animate-spin text-amber-600" />
              <span>{statusText}</span>
            </div>
          )}

          {/* Action Button: Simulate Payment & Upgrade */}
          <button
            type="button"
            onClick={handleSimulatePayment}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 active:scale-[0.98] text-slate-950 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin text-slate-950" />
                <span>Simulating Payment Gateway...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} className="text-slate-950" />
                <span>Simulate Payment & Upgrade</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-gray-400 mt-2.5">
            Instant 1.5s simulated PayHere checkout • Live database synchronization
          </p>
        </div>
      </div>
    </div>
  );
}
