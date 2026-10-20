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
import Navbar from './components/Navbar';
import NotificationBell from './components/NotificationBell';
import UserMenu from './components/UserMenu';
import ContactUs from './components/ContactUs';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Footer from './components/Footer';
import {
  subscribeListings,
  saveListing,
  getStoredLocalListings,
  saveStoredLocalListings,
} from './lib/storage';
import { onAuthChange, getProfile } from './lib/auth';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Toaster, toast } from 'react-hot-toast';
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
  const [flyToBoundaries, setFlyToBoundaries] = useState(null);

  const pickCallbackRef = useRef(null);

  // --- Celebratory welcome toast on email confirmation / SIGNED_IN & URL cleanup ---
  useEffect(() => {
    if (window.location.hash && window.location.hash.includes('access_token')) {
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }

    if (!isSupabaseConfigured || !supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // Delay slightly so it doesn't get lost in the page load
        setTimeout(() => {
          toast.success("Your email is confirmed! You are logged in. Sell it quicker than ever from the map! 🚀", {
            duration: 6000,
            icon: '🎉',
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          });
        }, 500);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

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
    if (listing?.id) {
      const current = getStoredLocalListings();
      saveStoredLocalListings([listing, ...current.filter((l) => l.id !== listing.id)]);
      return;
    }
    await saveListing(listing);
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
        <Navbar
          user={user}
          profile={profile}
          onAddClick={handleAddClick}
          onOpenMyListings={() => setShowMyListings(true)}
          onOpenProfile={() => setShowProfile(true)}
          onOpenAuth={() => setShowAuthModal(true)}
          onSignOut={handleSignOut}
        />

        {/* Row 2: Integrated Category Navigation & Filters (only for marketplace views) */}
        {!['/admin', '/contact', '/privacy', '/terms'].includes(location.pathname) && (
          <div className="px-4 sm:px-6 py-2 border-t border-gray-100/80">
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

        {/* Static Content Routes */}
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* Main Marketplace */}
        <Route
          path="*"
          element={
            <main className="flex-1 relative overflow-hidden">
              {viewMode === 'map' ? (
                <MapPage
                  listings={filteredListings}
                  onMarkerClick={setSelectedListing}
                  activeListing={selectedListing}
                  flyToBoundaries={flyToBoundaries}
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
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
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

      {/* App Footer */}
      <Footer />

      {/* Bottom sheet */}
      <ListingDetailSheet
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onViewSeller={handleViewSeller}
        onViewBoundaries={(boundaries, listing) => {
          setSelectedListing(listing);
          setFlyToBoundaries([...boundaries]);
          setViewMode('map');
        }}
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
