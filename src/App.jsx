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
import MyListings from './components/MyListings';
import { subscribeListings, saveListing } from './lib/storage';
import { onAuthChange, getProfile } from './lib/auth';
import { isSupabaseConfigured } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [showMyListings, setShowMyListings] = useState(false);
  const [viewSellerId, setViewSellerId] = useState(null);
  const [pickMode, setPickMode] = useState(false);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubCategory, setActiveSubCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const pickCallbackRef = useRef(null);

  // --- Check for /login URL route ---
  useEffect(() => {
    if (location.pathname === '/login' && !user) {
      setShowAuthModal(true);
    }
  }, [location.pathname, user]);

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
        const itemSub = (
          l.subCategory ||
          l.sub_category ||
          l.propertyType ||
          l.property_type ||
          l.vehicleType ||
          l.vehicle_type ||
          ''
        ).toLowerCase();
        if (itemSub !== activeSubCategory.toLowerCase()) {
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
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

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

      {/* Unified Modern Marketplace Header / Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 z-[1001] shrink-0 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        {/* Row 1: Brand Logo & User Actions */}
        <div className="h-13 px-4 flex items-center justify-between">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
            title="Return to Home"
          >
            <img
              src="/pin-logo.svg"
              alt="Selinmap Logo"
              className="w-8 h-8 object-contain shrink-0"
            />
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-lg font-black text-gray-900 tracking-tight">
                Selin<span className="text-emerald-600">map</span>
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-gray-400 border-l border-gray-200 pl-2 uppercase tracking-wider">
                Marketplace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Boolean(profile?.is_admin || user?.user_metadata?.is_admin || user?.is_admin) && (
              location.pathname === '/admin' ? (
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-950 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full border border-gray-300 transition-all cursor-pointer"
                  title="Return to Map"
                >
                  <Map size={14} />
                  <span>Back to Map</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-1.5 text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 active:scale-95 text-amber-950 px-3 py-1.5 rounded-full shadow-xs border border-amber-300 transition-all cursor-pointer"
                  title="Admin Dashboard"
                >
                  <span>👑 Admin Panel</span>
                </button>
              )
            )}

            {/* My Ads & Golden Pins Button */}
            <button
              onClick={() => setShowMyListings(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-100 to-yellow-100 hover:from-amber-200 hover:to-yellow-200 border border-amber-300/80 px-3 py-1.5 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
              title="My Ads & Golden Pins"
            >
              <span>⭐</span>
              <span className="hidden xs:inline">My Ads</span>
            </button>

            {user ? (
              <button
                onClick={() => setShowProfile(true)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-100 hover:ring-emerald-400 transition-all shadow-xs overflow-hidden cursor-pointer"
                title="My Profile"
              >
                {profile?.avatar_url || profile?.avatarUrl ? (
                  <img
                    src={profile.avatar_url || profile.avatarUrl}
                    alt={profile.name || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : profile?.name ? (
                  profile.name.charAt(0).toUpperCase()
                ) : (
                  user.email?.charAt(0).toUpperCase()
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-950 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <LogIn size={15} />
                <span>Login</span>
              </button>
            )}

            <button
              onClick={handleAddClick}
              className="flex items-center gap-1.5 bg-gray-950 hover:bg-gray-800 active:scale-95 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Post Ad</span>
            </button>
          </div>
        </div>

        {/* Row 2: Integrated Category Navigation & Filters (only for marketplace views) */}
        {location.pathname !== '/admin' && (
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
        )}
      </header>

      {/* Main View Router */}
      <Routes>
        {/* Protected Admin Route */}
        <Route
          path="/admin"
          element={
            <AdminRoute user={user} profile={profile}>
              <div className="flex-1 overflow-y-auto bg-slate-50">
                <AdminDashboard
                  user={user}
                  profile={profile}
                  onBack={() => navigate('/')}
                  onSelectListing={(listing) => {
                    navigate('/');
                    setSelectedListing(listing);
                    setViewMode('map');
                  }}
                />
              </div>
            </AdminRoute>
          }
        />

        {/* Main Marketplace */}
        <Route
          path="*"
          element={
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
          }
        />
      </Routes>

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
        onClose={() => {
          setShowAuthModal(false);
          if (location.pathname === '/login') {
            navigate('/', { replace: true });
          }
        }}
        onAuth={(fbUser) => {
          handleAuth(fbUser);
          if (location.pathname === '/login') {
            navigate('/', { replace: true });
          }
        }}
      />

      {/* Profile page */}
      {showProfile && (
        <ProfilePage
          user={user}
          onBack={() => setShowProfile(false)}
          onSignOut={handleSignOut}
          onProfileUpdate={(updated) => setProfile(updated)}
          onOpenMyListings={() => {
            setShowProfile(false);
            setShowMyListings(true);
          }}
        />
      )}

      {/* My Listings & Golden Pins Dashboard */}
      {showMyListings && (
        <MyListings
          user={user}
          listings={listings}
          onBack={() => setShowMyListings(false)}
          onSelectListing={(listing) => {
            setShowMyListings(false);
            setSelectedListing(listing);
            setViewMode('map');
          }}
          onPostAd={() => {
            setShowMyListings(false);
            handleAddClick();
          }}
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
    </div>
  );
}
