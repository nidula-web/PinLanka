import { useState } from 'react';
import {
  X,
  MapPin,
  Loader2,
  CheckCircle2,
  UploadCloud,
  FileCheck,
  Copy,
  Clock,
  Building2,
  AlertCircle,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { updateListing } from '../lib/storage';
import { uploadImage } from '../lib/uploadImage';
import { supabase } from '../lib/supabase';

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
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState('');
  const [uploadedSlipUrl, setUploadedSlipUrl] = useState('');
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState('');

  if (!open || !listing) return null;

  const price = getPremiumPrice(listing.mainCategory);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedAcc(label);
    toast.success(`Copied ${label} to clipboard!`, { duration: 2000 });
    setTimeout(() => setCopiedAcc(''), 2500);
  };

  const handleFileChange = async (e) => {
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

    // Immediately upload so we can strictly verify the upload
    setIsUploadingSlip(true);
    setUploadedSlipUrl('');
    try {
      const url = await uploadImage(file);
      if (!url) {
        throw new Error('Upload service did not return a valid URL.');
      }
      setUploadedSlipUrl(url);
      toast.success('Payment slip uploaded securely!', { id: 'slip-success', duration: 4000 });
    } catch (err) {
      console.error('Slip upload failed:', err);
      toast.error('Failed to upload payment slip: ' + (err.message || 'Please try again.'));
      setUploadedSlipUrl('');
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const handleSubmitPaymentSlip = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Strict Cloudinary check: ensure Cloudinary URL is not null/undefined
      const cloudinaryUrl = uploadedSlipUrl;
      if (!cloudinaryUrl) {
        throw new Error('Image upload failed.');
      }

      if (!listing?.id) {
        throw new Error('Listing ID is missing.');
      }

      // 2. Perform the Supabase update
      const { data, error } = await supabase
        .from('listings')
        .update({
          premium_status: 'pending',
          payment_slip_url: cloudinaryUrl,
        })
        .eq('id', listing.id)
        .select();

      // 3. IMMEDIATELY check for error
      if (error) throw error;

      // Also sync local storage so subscribers and storage stay in sync
      try {
        await updateListing(listing.id, {
          premium_status: 'pending',
          premiumStatus: 'pending',
          payment_slip_url: cloudinaryUrl,
          paymentSlipUrl: cloudinaryUrl,
        });
      } catch (storageErr) {
        console.warn('Storage sync warning:', storageErr);
      }

      // 4. Only if the Supabase update is 100% successful:
      // Show success toast with explicit 4 second auto-dismiss
      toast.success('Slip uploaded! Awaiting admin approval (2-4 hours).', {
        duration: 4000,
        icon: '⏳',
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          border: '1px solid #fbbf24',
          borderRadius: '16px',
          fontSize: '13px',
          fontWeight: '600',
        },
      });

      // 5. Trigger a refresh of the user's dashboard listings so they see the yellow "⏳ Golden Pin Pending" badge
      const updatedListing = (data && data[0]) || {
        ...listing,
        premium_status: 'pending',
        premiumStatus: 'pending',
        payment_slip_url: cloudinaryUrl,
        paymentSlipUrl: cloudinaryUrl,
      };

      if (onUpgradeSuccess) {
        onUpgradeSuccess(updatedListing);
      }

      // 6. Close modal
      handleModalClose();
    } catch (error) {
      console.error('Upgrade Error:', error);
      toast.error(error.message || 'Failed to submit payment slip.');
      // DO NOT close the modal and DO NOT update the local UI state if there is an error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (isSubmitting || isUploadingSlip) return;
    setSlipFile(null);
    setSlipPreview('');
    setUploadedSlipUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-3 sm:p-4">

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={handleModalClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-amber-200/90 overflow-hidden z-10 text-center animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Gold Gradient Top Banner Header */}
        <div className="h-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-xs shrink-0" />

        <div className="p-5 sm:p-6 overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={handleModalClose}
            disabled={isSubmitting || isUploadingSlip}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 cursor-pointer"
            title="Close modal"
          >
            <X size={18} />
          </button>

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
            Upgrade to Golden Pin
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 font-medium px-2">
            Boost visibility for <span className="font-bold text-gray-800">"{listing.title}"</span>
          </p>

          {/* Dynamic Pricing Box */}
          <div className="my-3.5 p-3 bg-gradient-to-b from-amber-50 to-yellow-50/50 border border-amber-200/90 rounded-2xl shadow-xs">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full inline-block mb-1">
              Manual Bank Transfer Upgrade
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight flex items-baseline justify-center gap-1.5">
              <span>Rs. {price.toLocaleString()}</span>
              <span className="text-xs sm:text-sm font-bold text-amber-800">/ 7 days</span>
            </div>
            <p className="text-[11px] text-amber-800/80 mt-0.5">
              Category:{' '}
              <strong className="capitalize">
                {String(listing.mainCategory || '').replace('_', ' ')}
              </strong>
            </p>
          </div>

          {/* Bank Transfer Form (Exclusive Payment Method) */}
          <form onSubmit={handleSubmitPaymentSlip} className="text-left space-y-3.5">
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 text-xs text-amber-950 font-medium">
              Please transfer or deposit <strong>Rs. {price.toLocaleString()}</strong> to either bank account below and upload your payment slip:
            </div>

            {/* Sri Lankan Bank Accounts */}
            <div className="space-y-2">
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
                        className="text-gray-400 hover:text-amber-600 transition-colors cursor-pointer"
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

            {/* Upload Payment Slip Input */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                <span>
                  Upload Payment Slip <span className="text-red-500">*</span>
                </span>
                {uploadedSlipUrl && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>Payment slip uploaded</span>
                  </span>
                )}
              </label>

              <label className={`relative border-2 border-dashed rounded-2xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                uploadedSlipUrl
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : isUploadingSlip
                  ? 'border-amber-400 bg-amber-50/40'
                  : 'border-gray-300 hover:border-amber-400 bg-gray-50/50 hover:bg-amber-50/20'
              }`}>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  disabled={isSubmitting || isUploadingSlip}
                  className="sr-only"
                />

                {isUploadingSlip ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 size={24} className="animate-spin text-amber-600" />
                    <p className="text-xs font-bold text-amber-900">
                      Uploading secure payment slip...
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Please wait a moment while we process your file
                    </p>
                  </div>
                ) : slipPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={slipPreview}
                      alt="Slip preview"
                      className="max-h-24 w-auto rounded-lg object-contain shadow-xs border border-gray-200"
                    />
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <FileCheck size={14} />
                      <span className="truncate max-w-[200px]">{slipFile?.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 underline hover:text-gray-600">
                      Click to choose a different slip
                    </span>
                  </div>
                ) : slipFile ? (
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <FileCheck size={28} className="text-emerald-600" />
                    <p className="text-xs font-bold text-gray-800">{slipFile.name}</p>
                    <span className="text-[10px] text-gray-400">Click to change</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 py-1">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-1">
                      <UploadCloud size={20} />
                    </div>
                    <p className="text-xs font-bold text-gray-800">
                      Click to upload bank transfer slip or deposit receipt
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Supports JPG, PNG, or PDF receipts up to 10MB
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!uploadedSlipUrl || isUploadingSlip || isSubmitting}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                !uploadedSlipUrl || isUploadingSlip || isSubmitting
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 active:scale-[0.98] text-slate-950 hover:shadow-lg'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin text-slate-950" />
                  <span>Submitting Payment Slip...</span>
                </>
              ) : isUploadingSlip ? (
                <>
                  <Loader2 size={18} className="animate-spin text-gray-400" />
                  <span>Uploading secure payment slip...</span>
                </>
              ) : !uploadedSlipUrl ? (
                <span>Upload Payment Slip to Submit</span>
              ) : (
                <>
                  <FileCheck size={18} className="text-slate-950" />
                  <span>Submit Payment Slip</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-400 text-center leading-normal">
              Admin verification takes 2 to 4 hours. Your Golden Pin activates immediately upon approval.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
