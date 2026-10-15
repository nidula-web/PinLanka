import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Phone, MessageCircle } from 'lucide-react';
import { getProfile } from '../lib/auth';
import { getListings, normalizeListing } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function SellerProfilePage({ sellerId, onBack, onListingClick }) {
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    let cancelled = false;

    async function load() {
      try {
        let prof = await getProfile(sellerId);
        let sellerListings = [];

        if (isSupabaseConfigured && supabase) {
          try {
            const { data, error } = await supabase
              .from('listings')
              .select('*')
              .or(`user_id.eq.${sellerId},seller_id.eq.${sellerId}`)
              .order('created_at', { ascending: false });

            if (data && !error && data.length > 0) {
              sellerListings = data.map(normalizeListing);
            }
          } catch (sbErr) {
            console.warn('Supabase seller listings query error, falling back:', sbErr);
          }
        }

        if (sellerListings.length === 0) {
          const allListings = await getListings();
          sellerListings = allListings.filter(
            (l) => l.sellerId === sellerId || l.user_id === sellerId
          );
        }

        if (cancelled) return;

        // If profile was not in database, derive basic info from listings
        if (!prof && sellerListings.length > 0) {
          prof = {
            uid: sellerId,
            name: sellerListings[0].sellerName || 'Verified Seller',
            phone: sellerListings[0].sellerPhone || '',
            userType: sellerListings[0].sellerType || 'owner',
            company: sellerListings[0].sellerType === 'broker' ? 'Property Agency' : '',
          };
        }

        setProfile(prof);
        setListings(sellerListings);
      } catch (err) {
        console.error('Failed to load seller profile:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [sellerId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[5000] bg-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const displayName = profile?.name || profile?.email || 'Seller';
  const phone = profile?.phone || '';

  return (
    <div className="fixed inset-0 z-[5000] bg-gray-50 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-100 shadow-sm z-10">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Seller Profile</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            {profile?.avatar_url || profile?.avatarUrl ? (
              <img
                src={profile.avatar_url || profile.avatarUrl}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/20 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{displayName}</h2>
              {profile?.company && (
                <p className="text-sm text-gray-500 truncate">{profile.company}</p>
              )}
              <span
                className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold capitalize ${
                  profile?.userType === 'owner'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {profile?.userType || 'owner'}
              </span>
            </div>
          </div>

          {profile?.bio && (
            <p className="text-sm text-gray-600 mt-3.5 pt-3 border-t border-gray-100 italic leading-relaxed">
              &ldquo;{profile.bio}&rdquo;
            </p>
          )}

          {phone && (
            <div className="flex gap-3 mt-4">
              <a
                href={`https://wa.me/${phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
              <a
                href={`tel:${phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                <Phone size={16} />
                Call
              </a>
            </div>
          )}
        </div>

        {/* Seller's listings */}
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {listings.length} Listing{listings.length !== 1 ? 's' : ''}
        </h3>

        {listings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No listings yet.</p>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <button
                key={l.id}
                onClick={() => onListingClick(l)}
                className="w-full bg-white rounded-xl shadow-sm p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex gap-3">
                  {l.imageUrls?.[0] && (
                    <img
                      src={l.imageUrls[0]}
                      alt=""
                      className="w-20 h-20 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{l.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{l.locationName}</p>
                    <p className="text-base font-extrabold text-gray-900 mt-1">
                      Rs {l.price?.toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {l.mainCategory && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 capitalize">
                          {l.mainCategory === 'real_estate' ? '🏠 Real Estate' : l.mainCategory === 'vehicles' ? '🚗 Vehicle' : l.mainCategory === 'electronics' ? '📱 Electronics' : '📦 Item'}
                        </span>
                      )}
                      {l.propertyType && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 capitalize">
                          {l.propertyType}
                        </span>
                      )}
                      {l.vehicleType && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700 capitalize">
                          {l.vehicleType === 'tuk' ? 'Three Wheeler' : l.vehicleType}
                        </span>
                      )}
                      {l.year && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                          {l.year}
                        </span>
                      )}
                      {l.size && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                          {l.size}
                        </span>
                      )}
                      {l.condition && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          {l.condition}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
