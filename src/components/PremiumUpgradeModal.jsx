import { useState } from 'react';
import {
  X,
  MapPin,
  Sparkles,
  Loader2,
  CheckCircle2,
  CreditCard,
  Building2,
  UploadCloud,
  FileCheck,
  Copy,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { updateListing } from '../lib/storage';
import { uploadImage } from '../lib/uploadImage';

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

const BANK_ACCOUNTS = [
  {
    bank: 'Commercial Bank',
    accountNumber: '123456789',
    branch: 'Colombo',
    accountName: 'Selinmap Pvt Ltd',
    logo: '🏦',
  },
  {
    bank: 'Bank of Ceylon (BOC)',
    accountNumber: '987654321',
    branch: 'Colombo',
    accountName: 'Selinmap Pvt Ltd',
    logo: '🏛️',
  },
];

export default function PremiumUpgradeModal({
  open,
  listing,
  onClose,
  onUpgradeSuccess,
}) {
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'bank'
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  // Bank Transfer states
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState('');
  const [copiedAcc, setCopiedAcc] = useState('');
  const [isPendingSuccess, setIsPendingSuccess] = useState(false);

  if (!open || !listing) return null;

  const price = getPremiumPrice(listing.mainCategory);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedAcc(label);
    toast.success(`Copied ${label} to clipboard!`, { duration: 2000 });
    setTimeout(() => setCopiedAcc(''), 2500);
  };

  const handleSlipChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image file (JPG, PNG) or PDF receipt.');
      return;
    }

    setSlipFile(file);
    if (file.type.startsWith('image/')) {
      setSlipPreview(URL.createObjectURL(file));
    } else {
      setSlipPreview('');
    }
  };

  // 1. Simulate Card Payment Gateway
  const handleSimulatePayment = async () => {
    setLoading(true);
    setStatusText('Redirecting to Payment Gateway (PayHere)...');

    try {
      // Show loading spinner for 1.5s to mock payment gateway redirect
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update is_premium to true in Supabase listings table & local state
      setStatusText('Activating Golden Pin on Map...');
      const updated = await updateListing(listing.id, {
        isPremium: true,
        is_premium: true,
        premium_status: 'active',
        premiumStatus: 'active',
      });

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

      if (onUpgradeSuccess) {
        onUpgradeSuccess(updated || { ...listing, isPremium: true, is_premium: true, premiumStatus: 'active' });
      }

      onClose();
    } catch (err) {
      console.error('Upgrade failed:', err);
      toast.error('Payment simulation failed: ' + (err.message || 'Please try again.'));
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  // 2. Manual Bank Transfer Slip Submission
  const handleSubmitBankTransfer = async (e) => {
    e.preventDefault();
    if (!slipFile) {
      toast.error('Please select and upload your bank deposit or transfer slip.');
      return;
    }

    setLoading(true);
    setStatusText('Uploading payment slip to secure server...');

    try {
      // Upload slip to Cloudinary
      const uploadedSlipUrl = await uploadImage(slipFile);

      setStatusText('Submitting upgrade request for admin verification...');
      const updated = await updateListing(listing.id, {
        premium_status: 'pending',
        premiumStatus: 'pending',
        payment_slip_url: uploadedSlipUrl,
      });

      setIsPendingSuccess(true);
      toast.success('Payment slip uploaded successfully!', { duration: 4000 });

      if (onUpgradeSuccess) {
        onUpgradeSuccess(updated || {
          ...listing,
          premium_status: 'pending',
          premiumStatus: 'pending',
          payment_slip_url: uploadedSlipUrl,
        });
      }
    } catch (err) {
      console.error('Bank transfer submission failed:', err);
      toast.error('Failed to upload slip: ' + (err.message || 'Please try again.'));
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  const handleModalClose = () => {
    if (loading) return;
    setIsPendingSuccess(false);
    setSlipFile(null);
    setSlipPreview('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
      <Toaster position="top-right" />

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={handleModalClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-amber-200/90 overflow-hidden z-10 text-center animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Gold Gradient Top Banner Header */}
        <div className="h-3.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-xs shrink-0" />

        <div className="p-5 sm:p-6 overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={handleModalClose}
            disabled={loading}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 cursor-pointer"
            title="Close modal"
          >
            <X size={18} />
          </button>

          {/* Pending Verification Success Screen */}
          {isPendingSuccess ? (
            <div className="py-6 px-2 animate-in fade-in duration-200 text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100/80 border-2 border-amber-300 text-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/10 mb-4 animate-bounce">
                <Clock size={40} className="stroke-[2.5]" />
              </div>

              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full inline-block mb-2">
                Pending Verification
              </span>

              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Slip Received!
              </h2>

              <div className="my-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-sm font-semibold text-amber-900 leading-relaxed max-w-sm mx-auto">
                Your slip is uploaded! We will verify and activate your Golden Pin within 2 to 24 hours.
              </div>

              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                Listing: <strong className="text-gray-800">"{listing.title}"</strong>
                <br />
                Your dashboard badge has been updated to <span className="font-bold text-amber-700">"Golden Pin Pending Approval"</span>.
              </p>

              <button
                type="button"
                onClick={handleModalClose}
                className="w-full py-3.5 px-6 rounded-xl font-black text-sm bg-gray-900 hover:bg-black text-white shadow-md transition-all cursor-pointer active:scale-95"
              >
                Back to My Listings
              </button>
            </div>
          ) : (
            <>
              {/* Glowing Gold Map Pin Icon */}
              <div className="relative mx-auto mt-1 mb-2 w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 blur-lg opacity-70 animate-pulse" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-amber-950 flex items-center justify-center shadow-xl ring-4 ring-amber-100">
                  <MapPin size={28} className="fill-amber-950 text-amber-950 drop-shadow-sm" />
                </div>
                <span className="absolute -top-1 -right-1 text-lg">⭐</span>
              </div>

              {/* Title & Enticing Pitch Message */}
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Stand out with a Golden Pin!
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 font-medium px-2">
                Boost visibility for <span className="font-bold text-gray-800">"{listing.title}"</span>
              </p>

              {/* Dynamic Pricing Box */}
              <div className="my-4 p-3.5 bg-gradient-to-b from-amber-50 to-yellow-50/50 border border-amber-200/90 rounded-2xl shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full inline-block mb-1">
                  Special Placement
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight flex items-baseline justify-center gap-1.5">
                  <span>Rs. {price.toLocaleString()}</span>
                  <span className="text-xs sm:text-sm font-bold text-amber-800">/ 7 days</span>
                </div>
                <p className="text-[11px] text-amber-800/80 mt-0.5">
                  Customized rate for{' '}
                  <strong className="capitalize">
                    {String(listing.mainCategory || '').replace('_', ' ')}
                  </strong>
                </p>
              </div>

              {/* Payment Method Toggle */}
              <div className="bg-gray-100/90 p-1 rounded-2xl grid grid-cols-2 gap-1 mb-5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  disabled={loading}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <CreditCard size={15} />
                  <span>Simulate Card Payment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  disabled={loading}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'bank'
                      ? 'bg-white text-amber-900 shadow-xs ring-1 ring-amber-300'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Building2 size={15} />
                  <span>Manual Bank Transfer</span>
                </button>
              </div>

              {/* Content depending on Payment Method */}
              {paymentMethod === 'card' ? (
                <>
                  {/* Benefits List */}
                  <div className="text-left space-y-2 mb-5 px-1 text-xs text-gray-700 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
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
                </>
              ) : (
                /* Bank Transfer Form */
                <form onSubmit={handleSubmitBankTransfer} className="text-left space-y-4">
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900 font-medium">
                    Please deposit <strong>Rs. {price.toLocaleString()}</strong> to either bank account below and upload the payment receipt or transaction screenshot:
                  </div>

                  {/* Sri Lankan Bank Accounts */}
                  <div className="space-y-2.5">
                    {BANK_ACCOUNTS.map((acc) => (
                      <div
                        key={acc.bank}
                        className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs flex items-center justify-between gap-2.5 hover:border-amber-300 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 font-bold text-gray-900">
                            <span>{acc.logo}</span>
                            <span className="truncate">{acc.bank}</span>
                          </div>
                          <div className="mt-1 font-mono font-bold text-gray-800 text-sm flex items-center gap-2">
                            <span>Acc: {acc.accountNumber}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(acc.accountNumber, `${acc.bank} Account`)}
                              className="text-gray-400 hover:text-amber-600 transition-colors"
                              title="Copy account number"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Branch: <strong>{acc.branch}</strong> • Name: <strong>{acc.accountName}</strong>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Upload Payment Slip */}
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      Upload Payment Slip <span className="text-red-500">*</span>
                    </label>

                    <label className="relative border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-amber-50/30">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleSlipChange}
                        disabled={loading}
                        className="sr-only"
                      />

                      {slipPreview ? (
                        <div className="flex flex-col items-center gap-2">
                          <img
                            src={slipPreview}
                            alt="Slip preview"
                            className="max-h-24 w-auto rounded-lg object-contain shadow-xs border border-gray-200"
                          />
                          <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <FileCheck size={14} />
                            <span>{slipFile?.name}</span>
                          </p>
                          <span className="text-[10px] text-gray-400 underline">
                            Click to choose a different slip
                          </span>
                        </div>
                      ) : slipFile ? (
                        <div className="flex flex-col items-center gap-1">
                          <FileCheck size={28} className="text-emerald-600" />
                          <p className="text-xs font-bold text-gray-800">{slipFile.name}</p>
                          <span className="text-[10px] text-gray-400">Click to change</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 py-1">
                          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-1">
                            <UploadCloud size={20} />
                          </div>
                          <p className="text-xs font-bold text-gray-700">
                            Upload Bank Receipt or Screenshot
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Supports JPG, PNG, or PDF up to 10MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Loading status */}
                  {loading && statusText && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center justify-center gap-2 animate-in fade-in duration-150">
                      <Loader2 size={16} className="animate-spin text-amber-600" />
                      <span>{statusText}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !slipFile}
                    className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 active:scale-[0.98] text-slate-950 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin text-slate-950" />
                        <span>Uploading & Submitting...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck size={18} className="text-slate-950" />
                        <span>Submit Slip for Verification</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-gray-400 text-center">
                    Manual verification takes 2 to 24 hours. Your Golden Pin activates immediately upon approval.
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
