import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Plus, User, LogIn, Info, X, Map, LayoutList, Shield } from 'lucide-react';
import MapPage from './components/MapPage';
import ListView from './components/ListView';
import ListingDetailSheet from './components/ListingDetailSheet';
import AddListingModal from './components/AddListingModal';
import FilterBar from './components/FilterBar';
import AuthModal from './components/AuthModal';
import ProfilePage from './components/ProfilePage';
import SellerProfilePage from './components/SellerProfilePage';
import AdminDashboard from './components/AdminDashboard';
import { subscribeListings, saveListing } from './lib/storage';
import { onAuthChange, getProfile } from './lib/auth';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  // --- Auth state ---
  const [user, setUser] = useState(null); // Supabase user
  const [profile, setProfile] = useState(null); // Supabase profile
  const [authReady, setAuthReady] = useState(false);

  // --- Listings ---
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);

  // --- UI state ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [viewSellerId, setViewSellerId] = useState(null);
  const [pickMode, setPickMode] = useState(false);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubCategory, setActiveSubCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const pickCallbackRef = useRef(null);

  // --- Check for /admin URL route ---
  useEffect(() => {
    const checkPath = () => {
      if (
        window.location.pathname === '/admin' ||
        window.location.pathname.startsWith('/admin') ||
        window.location.hash === '#admin'
      ) {
        setShowAdmin(true);
      }
    };
    checkPath();
    window.addEventListener('popstate', checkPath);
    return () => window.removeEventListener('popstate', checkPath);
  }, []);

  // --- Listen to auth state ---
  useEffect(() => {
    const unsub = onAuthChange(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const uid = authUser.id || authUser.uid;
        const prof = await getProfile(uid);
        setProfile(prof);
      } else {
        setProfile(null);
      }
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // --- Subscribe to Firestore listings (real-time) ---
  useEffect(() => {
    const unsub = subscribeListings((data) => {
      setListings(data);
    });
    return unsub;
  }, []);

  // --- Multi-Category Filtered listings ---
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      // Main category filter
      if (activeCategory !== 'all' && l.mainCategory !== activeCategory) {
        return false;
      }
      // Sub-category filter
      if (activeSubCategory !== 'all') {
        if (l.mainCategory === 'real_estate' && l.propertyType !== activeSubCategory) {
          return false;
        }
        if (l.mainCategory === 'vehicles' && l.vehicleType !== activeSubCategory) {
          return false;
        }
      }
      // Price range filters
      if (priceRange.min && l.price < Number(priceRange.min)) return false;
      if (priceRange.max && l.price > Number(priceRange.max)) return false;

      // Search query filter (title, description, main_category, location_name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (l.title || '').toLowerCase();
        const desc = (l.description || '').toLowerCase();
        const mainCat = (l.mainCategory || l.main_category || '').toLowerCase();
        const locName = (l.locationName || l.location_name || '').toLowerCase();
        const propType = (l.propertyType || l.property_type || '').toLowerCase();
        const vehType = (l.vehicleType || l.vehicle_type || '').toLowerCase();
        const brand = (l.brand || '').toLowerCase();

        const matches =
          title.includes(q) ||
          desc.includes(q) ||
          mainCat.includes(q) ||
          locName.includes(q) ||
          propType.includes(q) ||
          vehType.includes(q) ||
          brand.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [listings, activeCategory, activeSubCategory, priceRange, searchQuery]);

  // --- Handlers ---
  const handleAddClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowAddModal(true);
  };

  const handleSave = useCallback(async (listing) => {
    await saveListing(listing);
    // Real-time subscription will update listings automatically
  }, []);

  const handlePickMode = useCallback((callback) => {
    pickCallbackRef.current = callback;
    setShowAddModal(false);
    setPickMode(true);
  }, []);

  const handlePickLocation = useCallback((latlng) => {
    if (pickCallbackRef.current) {
      pickCallbackRef.current(latlng);
      pickCallbackRef.current = null;
    }
    setPickMode(false);
    setShowAddModal(true);
  }, []);

  const handleAuth = async (fbUser) => {
    setUser(fbUser);
    const prof = await getProfile(fbUser.uid);
    setProfile(prof);
  };

  const handleSignOut = () => {
    setUser(null);
    setProfile(null);
    setShowProfile(false);
  };

  const handleViewSeller = (sellerId) => {
    setSelectedListing(null); // close detail sheet
    setViewSellerId(sellerId);
  };

  const handleSellerListingClick = (listing) => {
    setViewSellerId(null);
    setSelectedListing(listing);
  };

  return (
    <div className="h-dvh w-screen flex flex-col overflow-hidden bg-gray-100">
      {/* Local Preview Mode Banner (slim) */}
      {!isSupabaseConfigured && !bannerDismissed && (
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-900 z-[1002] shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="truncate">
              <strong>Local Preview:</strong> Add Supabase keys in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code> to enable live cloud sync.
            </span>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="p-0.5 hover:bg-amber-100 rounded text-amber-700 ml-2 shrink-0"
            title="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Unified Modern Marketplace Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 z-[1001] shrink-0 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        {/* Row 1: Brand Logo & User Actions */}
        <div className="h-13 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/pin-logo.svg"
              alt="PinLanka Logo"
              className="w-8 h-8 object-contain shrink-0"
            />
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-lg font-black text-gray-900 tracking-tight">
                Pin<span className="text-emerald-600">Lanka</span>
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-gray-400 border-l border-gray-200 pl-2 uppercase tracking-wider">
                Marketplace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Boolean(profile?.is_admin || user?.user_metadata?.is_admin || user?.is_admin) && (
              <button
                onClick={() => {
                  setShowAdmin(true);
                  if (window.location.pathname !== '/admin') {
                    window.history.pushState(null, '', '/admin');
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 px-3 py-1.5 rounded-full shadow-xs transition-all"
                title="Admin Dashboard"
              >
                <Shield size={14} className="text-slate-950" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {user ? (
              <button
                onClick={() => setShowProfile(true)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-100 hover:ring-emerald-400 transition-all shadow-xs"
                title="My Profile"
              >
                {profile?.name
                  ? profile.name.charAt(0).toUpperCase()
                  : user.email?.charAt(0).toUpperCase()}
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-950 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <LogIn size={15} />
                <span>Login</span>
              </button>
            )}

            <button
              onClick={handleAddClick}
              className="flex items-center gap-1.5 bg-gray-950 hover:bg-gray-800 active:scale-95 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs hover:shadow transition-all"
            >
              <Plus size={15} />
              <span>Post Ad</span>
            </button>
          </div>
        </div>

        {/* Row 2: Integrated Category Navigation & Filters */}
        <div className="px-4 pb-2.5 pt-0.5 border-t border-gray-100/70">
          <FilterBar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            activeSubCategory={activeSubCategory}
            onSubCategoryChange={setActiveSubCategory}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
          />
        </div>
      </header>

      {/* Main Content Area: Map or List View */}
      <main className="flex-1 relative overflow-hidden">
        {viewMode === 'map' ? (
          <MapPage
            listings={filteredListings}
            onMarkerClick={setSelectedListing}
            pickMode={pickMode}
            onPickLocation={handlePickLocation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        ) : (
          <ListView
            listings={filteredListings}
            onListingClick={setSelectedListing}
          />
        )}

        {/* Floating View Toggle Button: [🗺️ Map] | [📄 List] */}
        {!pickMode && !selectedListing && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
            <div className="bg-gray-950/90 backdrop-blur-md p-1 rounded-full shadow-2xl border border-white/10 flex items-center gap-0.5 ring-1 ring-black/20">
              <button
                onClick={() => setViewMode('map')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 flex items-center gap-1.5 active:scale-95 ${
                  viewMode === 'map'
                    ? 'bg-white text-gray-950 shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Map size={14} />
                <span>Map</span>
              </button>

              <button
                onClick={() => setViewMode('list')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 flex items-center gap-1.5 active:scale-95 ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-950 shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <LayoutList size={14} />
                <span>List</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    viewMode === 'list'
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-white/15 text-white'
                  }`}
                >
                  {filteredListings.length}
                </span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom sheet */}
      <ListingDetailSheet
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onViewSeller={handleViewSeller}
        user={user}
        profile={profile}
      />

      {/* Add modal */}
      <AddListingModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSave}
        onPickMode={handlePickMode}
        user={user}
        profile={profile}
      />

      {/* Auth modal */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuth={handleAuth}
      />

      {/* Profile page */}
      {showProfile && (
        <ProfilePage
          user={user}
          onBack={() => setShowProfile(false)}
          onSignOut={handleSignOut}
        />
      )}

      {/* Seller profile page */}
      {viewSellerId && (
        <SellerProfilePage
          sellerId={viewSellerId}
          onBack={() => setViewSellerId(null)}
          onListingClick={handleSellerListingClick}
        />
      )}

      {/* Admin Dashboard */}
      {showAdmin && (
        <AdminDashboard
          user={user}
          profile={profile}
          onBack={() => {
            setShowAdmin(false);
            if (window.location.pathname === '/admin') {
              window.history.pushState(null, '', '/');
            }
          }}
          onSelectListing={(listing) => {
            setShowAdmin(false);
            setSelectedListing(listing);
            setViewMode('map');
            if (window.location.pathname === '/admin') {
              window.history.pushState(null, '', '/');
            }
          }}
        />
      )}
    </div>
  );
}
