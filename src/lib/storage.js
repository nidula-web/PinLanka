import { supabase, isSupabaseConfigured } from './supabase';

const LOCAL_STORAGE_KEY = 'sellinmap_marketplace_listings';
const LEGACY_STORAGE_KEY = 'pinlanka_marketplace_listings';

export const CATEGORY_EMOJIS = {
  real_estate: '🏠',
  vehicles: '🚗',
  electronics: '📱',
  services: '🛠️',
  others: '📦',
};

export const CATEGORY_LABELS = {
  real_estate: 'Real Estate',
  vehicles: 'Vehicles',
  electronics: 'Electronics',
  services: 'Services',
  others: 'Others',
};

// Rich multi-category Sri Lankan seed listings for immediate preview and testing
export const SEED_LISTINGS = [
  {
    id: 'seed-1',
    isPremium: true,
    mainCategory: 'real_estate',
    propertyType: 'apartment',
    subCategory: 'apartment',
    title: 'Luxury 3-Bed Penthouse with City Views',
    price: 85000000,
    priceTag: '85M',
    size: '2,200 sqft',
    locationName: 'Cinnamon Gardens, Colombo 07',
    lat: 6.9044,
    lng: 79.8683,
    description:
      'Stunning high-floor luxury apartment with panoramic views of Colombo skyline. Includes 3 en-suite bedrooms, imported Italian kitchen, swimming pool access, and 2 dedicated parking bays.',
    sellerId: 'seller_colombo',
    sellerName: 'Nimal Perera',
    sellerPhone: '+94771234567',
    sellerType: 'owner',
    imageUrls: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'seed-2',
    isPremium: true,
    mainCategory: 'vehicles',
    vehicleType: 'car',
    subCategory: 'car',
    brand: 'Toyota',
    year: '2021',
    mileage: '38,000 km',
    transmission: 'Automatic',
    title: 'Toyota Land Cruiser Prado TX-L 2021',
    price: 42500000,
    priceTag: '42.5M',
    locationName: 'Peradeniya Road, Kandy',
    lat: 7.2906,
    lng: 80.6337,
    description:
      'First owner, company maintained with full service records at Toyota Lanka. Sunroof, 7-seater, beige leather interior, brand new tyres, mint condition.',
    sellerId: 'seller_kandy_auto',
    sellerName: 'Kandy Premium Auto',
    sellerPhone: '+94719876543',
    sellerType: 'dealer',
    imageUrls: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: 'seed-3',
    mainCategory: 'electronics',
    condition: 'Like New',
    brand: 'Apple',
    model: 'MacBook Pro 16" M3 Max',
    title: 'MacBook Pro 16" M3 Max (36GB / 1TB SSD)',
    price: 890000,
    priceTag: '890k',
    locationName: 'Galle Fort, Galle',
    lat: 6.0329,
    lng: 80.2170,
    description:
      'Space Black color, battery health 100%, cycle count 18. Comes with full box, genuine MagSafe braided cable and 140W fast charger. AppleCare+ warranty remaining.',
    sellerId: 'seller_galle_tech',
    sellerName: 'Sunil Wickramasinghe',
    sellerPhone: '+94775551234',
    sellerType: 'owner',
    imageUrls: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: 'seed-4',
    mainCategory: 'vehicles',
    vehicleType: 'bike',
    brand: 'Yamaha',
    year: '2022',
    mileage: '12,500 km',
    transmission: 'Manual',
    title: 'Yamaha MT-15 Version 2.0 (ABS)',
    price: 1150000,
    priceTag: '1.15M',
    locationName: 'Lewis Place, Negombo',
    lat: 7.2088,
    lng: 79.8358,
    description:
      'Cyan Storm color, dual channel ABS, Bluetooth connectivity, single owner, carefully ridden with original accessories and clear registration documents.',
    sellerId: 'seller_negombo_moto',
    sellerName: 'West Coast Motors',
    sellerPhone: '+94762229876',
    sellerType: 'broker',
    imageUrls: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'seed-5',
    mainCategory: 'real_estate',
    propertyType: 'house',
    size: '2,400 sqft',
    title: 'Modern Architect-Designed Family Residence',
    price: 52000000,
    priceTag: '52M',
    locationName: 'Royal Gardens, Rajagiriya',
    lat: 6.9085,
    lng: 79.8972,
    description:
      'Tri-level contemporary architectural home with rooftop terrace, open-concept living area, double car garage, and 24-hour gated security neighborhood.',
    sellerId: 'seller_rajagiriya',
    sellerName: 'Chaminda Fernando',
    sellerPhone: '+94778884321',
    sellerType: 'owner',
    imageUrls: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
  },
  {
    id: 'seed-6',
    mainCategory: 'vehicles',
    vehicleType: 'tuk',
    brand: 'Bajaj',
    year: '2020',
    mileage: '45,000 km',
    transmission: 'Manual',
    title: 'Bajaj RE 4-Stroke Three Wheeler',
    price: 1450000,
    priceTag: '1.45M',
    locationName: 'Pettah, Colombo',
    lat: 6.9380,
    lng: 79.8540,
    description:
      'Original green color, new canopy, brand new tyres, engine 100% in running order. Revenue license & insurance up to date.',
    sellerId: 'seller_colombo_tuk',
    sellerName: 'Rohan Auto Sales',
    sellerPhone: '+94771122334',
    sellerType: 'broker',
    imageUrls: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
  },
  {
    id: 'seed-7',
    mainCategory: 'others',
    condition: 'Brand New',
    brand: 'Moratuwa Craft',
    model: 'Masterpiece 8-Seater',
    title: 'Solid Teak 8-Seater Dining Table & Chairs',
    price: 245000,
    priceTag: '245k',
    locationName: 'Moratuwa Town, Moratuwa',
    lat: 6.7730,
    lng: 79.8816,
    description:
      'Handcrafted seasoned grade-1 teak wood dining table with 10mm tempered glass top and 8 cushioned ergonomic high-back chairs. Islandwide delivery available.',
    sellerId: 'seller_moratuwa',
    sellerName: 'Moratuwa Teak Gallery',
    sellerPhone: '+94703337788',
    sellerType: 'dealer',
    imageUrls: [
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 96,
  },
  {
    id: 'seed-8',
    mainCategory: 'electronics',
    condition: 'Brand New',
    brand: 'Sony',
    model: 'Alpha 7 IV Mirrorless',
    title: 'Sony Alpha 7 IV Full-Frame Camera (Body Only)',
    price: 720000,
    priceTag: '720k',
    locationName: 'Kandy City Center, Kandy',
    lat: 7.2940,
    lng: 80.6380,
    description:
      'Brand new in sealed box with 2 years Singer / CameraLK warranty. 33MP Exmor R CMOS sensor, 4K 60p video, 10-bit 4:2:2, real-time eye AF.',
    sellerId: 'seller_kandy_cam',
    sellerName: 'Apex Electronics',
    sellerPhone: '+94776655443',
    sellerType: 'dealer',
    imageUrls: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 120,
  },
  {
    id: 'seed-9',
    isPremium: false,
    mainCategory: 'services',
    subCategory: 'home_construction',
    title: 'Architectural House Plans & 3D Interior Design',
    price: 75000,
    priceTag: '75k',
    locationName: 'High Level Road, Nugegoda',
    lat: 6.8649,
    lng: 79.8997,
    description:
      'Chartered architect consultation, municipality approval drawings, structural engineering plans, and photorealistic 3D interior/exterior rendering.',
    sellerId: 'seller_nugegoda_arch',
    sellerName: 'Lanka Blueprint Studio',
    sellerPhone: '+94775551234',
    sellerType: 'broker',
    isVerified: true,
    imageUrls: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 15,
  },
];

// Helper to normalize Supabase SQL columns into camelCase format
export function normalizeListing(row) {
  if (!row) return null;
  return {
    id: row.id,
    mainCategory: row.main_category || row.mainCategory || 'others',
    subCategory: row.sub_category || row.subCategory || row.property_type || row.vehicle_type || '',
    propertyType: row.property_type || row.propertyType || row.sub_category || '',
    vehicleType: row.vehicle_type || row.vehicleType || row.sub_category || '',
    isPremium: Boolean(row.is_premium || row.isPremium),
    premiumStatus: row.premium_status || row.premiumStatus || '',
    paymentSlipUrl: row.payment_slip_url || row.paymentSlipUrl || '',
    premiumExpiresAt: row.premium_expires_at || row.premiumExpiresAt || null,
    premium_expires_at: row.premium_expires_at || row.premiumExpiresAt || null,
    title: row.title || '',
    price: Number(row.price) || 0,
    priceTag: row.price_tag || row.priceTag || '',
    size: row.size || '',
    locationName: row.location_name || row.locationName || '',
    lat: Number(row.lat) || 0,
    lng: Number(row.lng) || 0,
    description: row.description || '',
    sellerId: row.user_id || row.sellerId || row.seller_id || '',
    sellerName: row.seller_name || row.sellerName || '',
    sellerPhone: row.seller_phone || row.sellerPhone || '',
    sellerType: row.seller_type || row.sellerType || 'owner',
    isVerified: Boolean(row.is_verified || row.isVerified),
    brand: row.brand || '',
    year: row.year ? String(row.year) : '',
    mileage: row.mileage || '',
    transmission: row.transmission || '',
    condition: row.condition || '',
    model: row.model || '',
    imageUrls: Array.isArray(row.image_urls)
      ? row.image_urls
      : Array.isArray(row.imageUrls)
      ? row.imageUrls
      : [],
    createdAt: row.created_at || row.createdAt || Date.now(),
  };
}

// Local state & change subscribers
const listeners = new Set();

export function getStoredLocalListings() {
  try {
    let raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }
    if (!raw) {
      if (isSupabaseConfigured) {
        return [];
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_LISTINGS));
      return SEED_LISTINGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (isSupabaseConfigured) {
        // Strip out legacy dummy seed listings so they don't corrupt real Supabase state
        return parsed.filter((item) => item.id && !String(item.id).startsWith('seed-'));
      }
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredLocalListings(listings) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(listings));
  } catch {
    // Ignore storage quota
  }
  listeners.forEach((cb) => cb(listings));
}

/**
 * Subscribe to real-time listing updates using Supabase.
 * Returns an unsubscribe function.
 */
export function subscribeListings(callback) {
  if (isSupabaseConfigured && supabase) {
    // 1. Initial fetch from Supabase
    getListings().then((initial) => {
      callback(initial);
    });

    // 2. Real-time subscription to postgres_changes
    const channel = supabase
      .channel('public:listings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        async () => {
          const updated = await getListings();
          callback(updated);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Local fallback subscription
  listeners.add(callback);
  setTimeout(() => {
    callback(getStoredLocalListings());
  }, 0);

  return () => {
    listeners.delete(callback);
  };
}

/**
 * One-shot fetch of all listings from Supabase.
 */
export async function getListings() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map(normalizeListing);
      }
      if (error) {
        console.error('Supabase getListings error:', error);
      }
    } catch (err) {
      console.warn('Supabase getListings error, returning local listings:', err);
    }
  }
  return getStoredLocalListings();
}

/**
 * Save a new listing (to Supabase 'listings' table if configured, else to localStorage).
 */
export async function saveListing(listing, currentUserId) {
  const rawUserId = currentUserId || listing.sellerId || listing.user_id;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId);
  const userId = isUUID ? rawUserId : null;

  if (isSupabaseConfigured && supabase) {
    try {
      // Guaranteed columns verified in Supabase public.listings schema
      const baseRow = {
        user_id: userId,
        title: listing.title,
        price: Number(listing.price),
        price_tag: listing.priceTag || '',
        main_category: listing.mainCategory || 'others',
        sub_category: listing.subCategory || listing.propertyType || listing.vehicleType || null,
        property_type: listing.propertyType || listing.subCategory || null,
        brand: listing.brand || null,
        model: listing.model || null,
        size: listing.size || null,
        location_name: listing.locationName || '',
        lat: Number(listing.lat),
        lng: Number(listing.lng),
        description: listing.description || '',
        image_urls: listing.imageUrls || [],
        seller_type: listing.sellerType || 'owner',
        is_premium: Boolean(listing.isPremium || listing.is_premium),
      };

      // Optional extended columns if database has migrated
      const extendedRow = {
        ...baseRow,
        vehicle_type: listing.vehicleType || listing.subCategory || null,
        year: listing.year ? String(listing.year) : null,
        mileage: listing.mileage || null,
        transmission: listing.transmission || null,
        condition: listing.condition || null,
        seller_name: listing.sellerName || '',
        seller_phone: listing.sellerPhone || '',
      };

      const sanitize = (obj) => {
        const out = { ...obj };
        Object.keys(out).forEach((key) => {
          if (out[key] === '' || out[key] === null || out[key] === undefined) {
            delete out[key];
          }
        });
        return out;
      };

      let insertData = null;
      let insertError = null;

      // 1. Attempt insert with extended fields
      const firstTry = await supabase
        .from('listings')
        .insert([sanitize(extendedRow)])
        .select()
        .single();

      if (!firstTry.error && firstTry.data) {
        insertData = firstTry.data;
      } else if (firstTry.error) {
        // 2. If it failed due to a missing column, fallback to guaranteed baseRow
        if (
          firstTry.error.message &&
          firstTry.error.message.includes('column') &&
          firstTry.error.message.includes('does not exist')
        ) {
          const secondTry = await supabase
            .from('listings')
            .insert([sanitize(baseRow)])
            .select()
            .single();

          if (!secondTry.error && secondTry.data) {
            insertData = secondTry.data;
          } else {
            insertError = secondTry.error;
          }
        } else {
          insertError = firstTry.error;
        }
      }

      if (insertData) {
        const normalized = normalizeListing(insertData);
        const current = getStoredLocalListings();
        saveStoredLocalListings([normalized, ...current.filter((l) => l.id !== normalized.id)]);
        return normalized;
      } else if (insertError) {
        throw insertError;
      }
    } catch (err) {
      console.error('Supabase saveListing exception:', err);
      throw err;
    }
  }

  // Local mode save
  const current = getStoredLocalListings();
  const newListing = {
    ...listing,
    id: 'local_' + Date.now(),
    isPremium: Boolean(listing.isPremium || listing.is_premium),
    createdAt: Date.now(),
  };
  const updated = [newListing, ...current];
  saveStoredLocalListings(updated);
  listeners.forEach((cb) => cb(updated));
  return newListing;
}

/**
 * Update an existing listing (e.g. Upgrade to Golden Pin).
 */
export async function updateListing(id, updates) {
  const current = getStoredLocalListings();

  if (isSupabaseConfigured && supabase) {
    const isUUID =
      typeof id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUUID) {
      try {
        const payload = {};
        if (updates.isPremium !== undefined) payload.is_premium = Boolean(updates.isPremium);
        if (updates.is_premium !== undefined) payload.is_premium = Boolean(updates.is_premium);
        if (updates.premiumStatus !== undefined) payload.premium_status = updates.premiumStatus;
        if (updates.premium_status !== undefined) payload.premium_status = updates.premium_status;
        if (updates.paymentSlipUrl !== undefined) payload.payment_slip_url = updates.paymentSlipUrl;
        if (updates.payment_slip_url !== undefined) payload.payment_slip_url = updates.payment_slip_url;
        if (updates.premiumExpiresAt !== undefined) payload.premium_expires_at = updates.premiumExpiresAt;
        if (updates.premium_expires_at !== undefined) payload.premium_expires_at = updates.premium_expires_at;

        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.price !== undefined) payload.price = Number(updates.price);
        if (updates.priceTag !== undefined) payload.price_tag = updates.priceTag;
        if (updates.price_tag !== undefined) payload.price_tag = updates.price_tag;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.mainCategory !== undefined) payload.main_category = updates.mainCategory;
        if (updates.main_category !== undefined) payload.main_category = updates.main_category;
        if (updates.subCategory !== undefined) payload.sub_category = updates.subCategory;
        if (updates.sub_category !== undefined) payload.sub_category = updates.sub_category;
        if (updates.propertyType !== undefined) payload.property_type = updates.propertyType;
        if (updates.vehicleType !== undefined) payload.vehicle_type = updates.vehicleType;
        if (updates.brand !== undefined) payload.brand = updates.brand;
        if (updates.model !== undefined) payload.model = updates.model;
        if (updates.year !== undefined) payload.year = updates.year;
        if (updates.mileage !== undefined) payload.mileage = updates.mileage;
        if (updates.transmission !== undefined) payload.transmission = updates.transmission;
        if (updates.condition !== undefined) payload.condition = updates.condition;
        if (updates.size !== undefined) payload.size = updates.size;
        if (updates.locationName !== undefined) payload.location_name = updates.locationName;
        if (updates.location_name !== undefined) payload.location_name = updates.location_name;
        if (updates.lat !== undefined) payload.lat = Number(updates.lat);
        if (updates.lng !== undefined) payload.lng = Number(updates.lng);
        if (updates.imageUrls !== undefined) payload.image_urls = updates.imageUrls;
        if (updates.image_urls !== undefined) payload.image_urls = updates.image_urls;
        if (updates.sellerPhone !== undefined) payload.seller_phone = updates.sellerPhone;
        if (updates.seller_phone !== undefined) payload.seller_phone = updates.seller_phone;
        if (updates.sellerType !== undefined) payload.seller_type = updates.sellerType;
        if (updates.seller_type !== undefined) payload.seller_type = updates.seller_type;

        const { data, error } = await supabase
          .from('listings')
          .update(payload)
          .eq('id', id)
          .select()
          .maybeSingle();

        if (error) {
          console.error('Supabase updateListing error:', error);
        } else if (data) {
          const normalized = normalizeListing(data);
          const updated = current.map((l) => (l.id === id ? { ...l, ...normalized } : l));
          saveStoredLocalListings(updated);
          listeners.forEach((cb) => cb(updated));
          return normalized;
        }
      } catch (err) {
        console.error('Supabase updateListing exception, updating locally:', err);
      }
    } else {
      console.warn('Skipping Supabase updateListing for non-UUID id:', id);
    }
  }

  // Local mode update
  const updated = current.map((l) =>
    l.id === id
      ? {
          ...l,
          ...updates,
          isPremium:
            updates.isPremium !== undefined
              ? Boolean(updates.isPremium)
              : updates.is_premium !== undefined
              ? Boolean(updates.is_premium)
              : Boolean(l.isPremium),
          premiumStatus:
            updates.premiumStatus !== undefined
              ? updates.premiumStatus
              : updates.premium_status !== undefined
              ? updates.premium_status
              : l.premiumStatus,
          paymentSlipUrl:
            updates.paymentSlipUrl !== undefined
              ? updates.paymentSlipUrl
              : updates.payment_slip_url !== undefined
              ? updates.payment_slip_url
              : l.paymentSlipUrl,
          premiumExpiresAt:
            updates.premiumExpiresAt !== undefined
              ? updates.premiumExpiresAt
              : updates.premium_expires_at !== undefined
              ? updates.premium_expires_at
              : l.premiumExpiresAt || null,
          premium_expires_at:
            updates.premium_expires_at !== undefined
              ? updates.premium_expires_at
              : updates.premiumExpiresAt !== undefined
              ? updates.premiumExpiresAt
              : l.premium_expires_at || null,
        }
      : l
  );
  saveStoredLocalListings(updated);
  listeners.forEach((cb) => cb(updated));
  return updated.find((l) => l.id === id);
}

/**
 * Helper to check if a listing's Golden Pin is currently active.
 * Applies ONLY if is_premium === true AND (premium_expires_at is null OR in the future).
 */
export function isListingPremiumActive(listing) {
  if (!listing) return false;
  const isPrem = Boolean(listing.is_premium || listing.isPremium);
  if (!isPrem) return false;

  const expiresAt = listing.premium_expires_at || listing.premiumExpiresAt;
  if (!expiresAt) return true; // if null, active

  try {
    return new Date(expiresAt).getTime() > Date.now();
  } catch {
    return true;
  }
}

/**
 * Helper to check if a listing's approved Golden Pin has expired.
 * Matches: premium_status === 'approved' AND premium_expires_at < new Date().toISOString()
 */
export function isListingPremiumExpired(listing) {
  if (!listing) return false;
  const status = listing.premium_status || listing.premiumStatus;
  const expiresAt = listing.premium_expires_at || listing.premiumExpiresAt;

  if (status === 'approved' && expiresAt) {
    try {
      return new Date(expiresAt).toISOString() < new Date().toISOString();
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Delete a listing by id.
 */
export async function deleteListing(id) {
  const isUUID =
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (isSupabaseConfigured && supabase && isUUID) {
    try {
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (error) {
        console.error('Supabase deleteListing error:', error);
      }
    } catch (err) {
      console.error('Supabase deleteListing exception:', err);
    }
  }

  const current = getStoredLocalListings();
  const updated = current.filter((l) => l.id !== id);
  saveStoredLocalListings(updated);
  listeners.forEach((cb) => cb(updated));
}
