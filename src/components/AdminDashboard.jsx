import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Phone,
  MessageCircle,
  Clock,
  Layers,
  Filter,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { deleteListing, SEED_LISTINGS } from '../lib/storage';

export default function AdminDashboard({
  user,
  profile,
  onBack,
  onSelectListing,
  onAdminProfileUpdated,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'listings' | 'users'
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(null); // null = checking, true, false

  // Data states
  const [listings, setListings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [inquiries, setInquiries] = useState([]);

  // Search & filter states
  const [listingSearch, setListingSearch] = useState('');
  const [listingCategoryFilter, setListingCategoryFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Deletion modals / confirmations
  const [deletingListingId, setDeletingListingId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Security Check on Mount
  useEffect(() => {
    let cancelled = false;

    async function checkAdminAccess() {
      setLoading(true);

      // Check if user is logged in
      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      // Check if user has admin privileges
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id || user.uid)
            .maybeSingle();

          if (cancelled) return;

          if (data && data.is_admin === true) {
            setIsAuthorized(true);
            await fetchDashboardData();
          } else if (profile?.is_admin === true || user?.user_metadata?.is_admin === true) {
            setIsAuthorized(true);
            await fetchDashboardData();
          } else {
            setIsAuthorized(false);
          }
        } catch (err) {
          console.warn('Admin check error:', err);
          if (profile?.is_admin === true) {
            setIsAuthorized(true);
            await fetchDashboardData();
          } else {
            setIsAuthorized(false);
          }
        }
      } else {
        // Local preview fallback check
        const isLocalAdmin = Boolean(
          profile?.is_admin ||
          user?.is_admin ||
          localStorage.getItem('pinlanka_demo_admin') === 'true'
        );
        setIsAuthorized(isLocalAdmin);
        if (isLocalAdmin) {
          await fetchDashboardData();
        }
      }

      if (!cancelled) setLoading(false);
    }

    checkAdminAccess();
    return () => {
      cancelled = true;
    };
  }, [user, profile]);

  // Fetch all listings, profiles, and inquiries
  const fetchDashboardData = async () => {
    setActionLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        // 1. Fetch Listings
        const { data: listingsData } = await supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false });

        // 2. Fetch Profiles / Users
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        // 3. Fetch Inquiries
        const { data: inquiriesData } = await supabase
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false });

        if (listingsData && listingsData.length > 0) {
          setListings(
            listingsData.map((l) => ({
              id: l.id,
              title: l.title || 'Untitled',
              price: Number(l.price) || 0,
              priceTag: l.price_tag || '',
              mainCategory: l.main_category || 'others',
              propertyType: l.property_type || '',
              vehicleType: l.vehicle_type || '',
              sellerName: l.seller_name || 'Anonymous',
              sellerType: l.seller_type || 'owner',
              isVerified: Boolean(l.is_verified),
              locationName: l.location_name || 'Sri Lanka',
              lat: Number(l.lat) || 6.9271,
              lng: Number(l.lng) || 79.8612,
              imageUrls: l.image_urls || [],
              createdAt: l.created_at || new Date().toISOString(),
            }))
          );
        } else {
          setListings(SEED_LISTINGS);
        }

        if (profilesData && profilesData.length > 0) {
          setUsersList(
            profilesData.map((p) => ({
              id: p.id,
              name: p.full_name || p.name || 'Anonymous',
              email: p.email || 'No email',
              phone: p.phone || 'N/A',
              userType: p.user_type || 'owner',
              is_verified: Boolean(p.is_verified),
              is_admin: Boolean(p.is_admin),
              company: p.company || '',
              bio: p.bio || '',
              avatar_url: p.avatar_url || '',
              avatarUrl: p.avatar_url || '',
              createdAt: p.created_at || new Date().toISOString(),
            }))
          );
        } else {
          // Fallback demo users from seed listings
          setUsersList(generateDemoUsers());
        }

        if (inquiriesData) {
          setInquiries(inquiriesData);
        }
      } else {
        // Local preview fallback data
        const localListingsRaw = localStorage.getItem('pinlanka_marketplace_listings');
        const localListings = localListingsRaw ? JSON.parse(localListingsRaw) : SEED_LISTINGS;
        setListings(localListings);
        setUsersList(generateDemoUsers());
        setInquiries([
          {
            id: 'inq-1',
            property_id: 'seed-1',
            broker_id: 'seller_colombo',
            buyer_phone: '077 123 4567',
            contact_method: 'whatsapp',
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'inq-2',
            property_id: 'seed-2',
            broker_id: 'seller_kandy_auto',
            buyer_phone: '071 987 6543',
            contact_method: 'call',
            created_at: new Date(Date.now() - 7200000).toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
      toast.error('Failed to sync live data');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to generate seed users if profiles table is empty
  function generateDemoUsers() {
    const demo = [
      {
        id: user?.id || 'admin_user',
        name: profile?.name || user?.email?.split('@')[0] || 'Platform Owner',
        email: user?.email || 'admin@pinlanka.lk',
        phone: profile?.phone || '+94770000001',
        userType: 'owner',
        is_verified: true,
        is_admin: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'seller_colombo',
        name: 'Nimal Perera',
        email: 'nimal@colomborealty.lk',
        phone: '+94771234567',
        userType: 'broker',
        is_verified: true,
        is_admin: false,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'seller_kandy_auto',
        name: 'Kandy Premium Auto',
        email: 'sales@kandyauto.lk',
        phone: '+94719876543',
        userType: 'dealer',
        is_verified: false,
        is_admin: false,
        createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      },
      {
        id: 'seller_galle_tech',
        name: 'Sunil Wickramasinghe',
        email: 'sunil@galleexpress.lk',
        phone: '+94775551234',
        userType: 'owner',
        is_verified: false,
        is_admin: false,
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
    ];
    return demo;
  }

  // Action: Delete Listing
  const handleDeleteListing = async (listingId) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to permanently delete this listing? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    try {
      await deleteListing(listingId);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      toast.success('Listing deleted successfully');
    } catch (err) {
      console.error('Delete listing error:', err);
      toast.error('Failed to delete listing: ' + err.message);
    }
  };

  // Action: Toggle Verified Status
  const handleToggleVerified = async (targetUser) => {
    const newStatus = !targetUser.is_verified;
    try {
      if (isSupabaseConfigured && supabase) {
        // 1. Update profiles table
        const { error: profError } = await supabase
          .from('profiles')
          .update({ is_verified: newStatus })
          .eq('id', targetUser.id);

        if (profError) throw profError;

        // 2. Also update listings table so markers reflect the 🛡️ tick on map
        await supabase
          .from('listings')
          .update({ is_verified: newStatus })
          .eq('user_id', targetUser.id);
      }

      // Update local state
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_verified: newStatus } : u))
      );
      setListings((prev) =>
        prev.map((l) =>
          l.sellerId === targetUser.id || l.user_id === targetUser.id
            ? { ...l, isVerified: newStatus }
            : l
        )
      );

      if (newStatus) {
        toast.success(`Broker verified! 🛡️ Added verified badge`);
      } else {
        toast.success(`Broker verification removed`);
      }
    } catch (err) {
      console.error('Toggle verified error:', err);
      toast.error('Failed to update verification: ' + err.message);
    }
  };

  // Action: Delete User
  const handleDeleteUser = async (targetUserId) => {
    if (targetUserId === user?.id) {
      toast.error('Cannot delete your own admin account.');
      return;
    }

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this user profile? Their listings may be orphaned.'
    );
    if (!confirmDelete) return;

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('profiles').delete().eq('id', targetUserId);
        if (error) throw error;
      }

      setUsersList((prev) => prev.filter((u) => u.id !== targetUserId));
      toast.success('User profile removed successfully');
    } catch (err) {
      console.error('Delete user error:', err);
      toast.error('Failed to delete user: ' + err.message);
    }
  };

  // Action: View on Map
  const handleViewOnMap = (listing) => {
    toast.success(`Locating "${listing.title}" on map...`);
    onSelectListing(listing);
  };

  // Local Admin override helper for immediate preview testing
  const grantLocalAdmin = () => {
    localStorage.setItem('pinlanka_demo_admin', 'true');
    setIsAuthorized(true);
    fetchDashboardData();
    toast.success('Local Admin privileges granted for preview testing!');
  };

  // Filtered Listings
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const matchSearch =
        l.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
        l.locationName?.toLowerCase().includes(listingSearch.toLowerCase()) ||
        l.sellerName?.toLowerCase().includes(listingSearch.toLowerCase());
      const matchCat =
        listingCategoryFilter === 'all' || l.mainCategory === listingCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [listings, listingSearch, listingCategoryFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.phone.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole =
        userRoleFilter === 'all' ||
        (userRoleFilter === 'admin' ? u.is_admin : u.userType === userRoleFilter);
      return matchSearch && matchRole;
    });
  }, [usersList, userSearch, userRoleFilter]);

  // Category breakdown counts
  const categoryStats = useMemo(() => {
    const counts = { real_estate: 0, vehicles: 0, electronics: 0, others: 0 };
    listings.forEach((l) => {
      if (counts[l.mainCategory] !== undefined) {
        counts[l.mainCategory]++;
      } else {
        counts.others++;
      }
    });
    return counts;
  }, [listings]);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-[5000] bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 size={36} className="animate-spin text-amber-500 mb-3" />
        <p className="text-sm font-semibold tracking-wider text-slate-300">
          Verifying Security & Admin Privileges...
        </p>
      </div>
    );
  }

  // ACCESS DENIED SCREEN (Security requirement)
  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-[5000] bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-24 h-24 rounded-3xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-500 mb-6 shadow-[0_0_50px_rgba(239,68,68,0.25)] animate-pulse">
          <ShieldAlert size={52} />
        </div>

        <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black tracking-widest uppercase mb-3">
          403 Forbidden Area
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
          Access Denied
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-md mb-6 leading-relaxed">
          You do not have administrative privileges to view this portal. Only authorized platform owners and staff can access the PinLanka Admin Console.
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-md w-full mb-6 text-left">
          <p className="text-xs font-semibold text-slate-400 mb-1">Authenticated Account:</p>
          <p className="text-xs font-mono text-amber-400 truncate">
            {user?.email || 'Guest / Unauthenticated'}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Status: <span className="text-red-400 font-semibold">is_admin = false</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            <span>Return to Map</span>
          </button>

          {/* Local testing helper button so developers/testers can demo right away */}
          <button
            onClick={grantLocalAdmin}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all active:scale-95"
            title="For local testing if your Supabase table has not updated is_admin yet"
          >
            Grant Demo Admin (Local Preview)
          </button>
        </div>

        <p className="text-[11px] text-slate-600 mt-8 max-w-sm">
          To grant admin privileges permanently in Supabase, execute:
          <br />
          <code className="text-slate-400 font-mono text-[10px]">
            UPDATE profiles SET is_admin = true WHERE email = '{user?.email}';
          </code>
        </p>
      </div>
    );
  }

  // AUTHORIZED ADMIN DASHBOARD
  return (
    <div className="fixed inset-0 z-[5000] bg-slate-950 flex flex-col md:flex-row overflow-hidden font-sans">
      <Toaster position="top-right" />

      {/* LEFT SIDEBAR (Dark SaaS style) */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        {/* Brand / Logo */}
        <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/pin-logo.svg"
              alt="PinLanka Logo"
              className="w-8 h-8 object-contain shrink-0"
            />
            <div>
              <h2 className="text-sm font-black text-white tracking-tight leading-none">
                Pin<span className="text-emerald-400">Lanka</span>
              </h2>
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                Owner Console
              </span>
            </div>
          </div>

          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            title="Back to Map"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-3 md:p-4 space-y-1.5 flex md:flex-col overflow-x-auto md:overflow-visible">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 md:flex-initial flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard size={16} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('listings')}
            className={`flex-1 md:flex-initial flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'listings'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <MapPin size={16} />
              <span>Listings</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'listings'
                  ? 'bg-slate-950 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {listings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 md:flex-initial flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users size={16} />
              <span>Users & Brokers</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'users'
                  ? 'bg-slate-950 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {usersList.length}
            </span>
          </button>
        </nav>

        {/* Bottom User Card & Exit */}
        <div className="hidden md:block p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-800 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {profile?.name || user?.email?.split('@')[0] || 'Administrator'}
                </p>
                <p className="text-[10px] text-emerald-400 font-semibold truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Verified Admin
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all active:scale-95"
          >
            <ArrowLeft size={14} />
            <span>Exit to Live Map</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 bg-slate-50 flex flex-col overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 px-6 bg-white border-b border-gray-200 flex items-center justify-between shrink-0 shadow-xs">
          <div>
            <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight capitalize">
              {activeTab === 'overview' && 'Platform Overview & Metrics'}
              {activeTab === 'listings' && 'Manage Marketplace Listings'}
              {activeTab === 'users' && 'Manage Users & Broker Verification'}
            </h1>
            <p className="text-xs text-gray-500">
              {activeTab === 'overview' && 'Live system health, registered accounts & broker inquiries'}
              {activeTab === 'listings' && 'Search, inspect or remove listings published across Sri Lanka'}
              {activeTab === 'users' && 'Grant broker verification badges (🛡️) and manage registered accounts'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs"
              title="Refresh Live Data"
            >
              <RefreshCw size={13} className={actionLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs font-bold text-white active:scale-95 transition-all shadow-xs"
            >
              <MapPin size={13} />
              <span>Map View</span>
            </button>
          </div>
        </header>

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6 max-w-7xl">
            {/* 3 BIG STAT CARDS (Requirement 3) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Stat 1: Total Active Listings */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-4">
                    <MapPin size={24} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Total Active Listings
                  </p>
                  <p className="text-3xl font-black text-gray-900 mt-1">
                    {listings.length}
                  </p>
                  <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                    <span>●</span> Live on map across Sri Lanka
                  </p>
                </div>
              </div>

              {/* Stat 2: Total Registered Users */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-700 flex items-center justify-center mb-4">
                    <Users size={24} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Total Registered Users
                  </p>
                  <p className="text-3xl font-black text-gray-900 mt-1">
                    {usersList.length}
                  </p>
                  <p className="text-xs text-blue-600 font-semibold mt-2 flex items-center gap-1">
                    <span>👥</span> Owners, Brokers & Dealers
                  </p>
                </div>
              </div>

              {/* Stat 3: Total Broker Inquiries */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center mb-4">
                    <ShieldCheck size={24} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Total Broker Inquiries
                  </p>
                  <p className="text-3xl font-black text-gray-900 mt-1">
                    {inquiries.length}
                  </p>
                  <p className="text-xs text-amber-600 font-semibold mt-2 flex items-center gap-1">
                    <span>🛡️</span> Digital Handshake Agreements
                  </p>
                </div>
              </div>
            </div>

            {/* Category Breakdown & Quick Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Category distribution */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm lg:col-span-2">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Listings by Category</span>
                  <span className="text-xs font-semibold text-gray-400 lowercase">
                    {listings.length} items total
                  </span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                    <span className="text-2xl mb-1 block">🏠</span>
                    <p className="text-xs font-bold text-gray-700">Real Estate</p>
                    <p className="text-xl font-black text-gray-900 mt-1">
                      {categoryStats.real_estate}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                    <span className="text-2xl mb-1 block">🚗</span>
                    <p className="text-xs font-bold text-gray-700">Vehicles</p>
                    <p className="text-xl font-black text-gray-900 mt-1">
                      {categoryStats.vehicles}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                    <span className="text-2xl mb-1 block">📱</span>
                    <p className="text-xs font-bold text-gray-700">Electronics</p>
                    <p className="text-xl font-black text-gray-900 mt-1">
                      {categoryStats.electronics}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                    <span className="text-2xl mb-1 block">📦</span>
                    <p className="text-xs font-bold text-gray-700">Others</p>
                    <p className="text-xl font-black text-gray-900 mt-1">
                      {categoryStats.others}
                    </p>
                  </div>
                </div>
              </div>

              {/* Verified Brokers Summary */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-blue-600" />
                    <span>Broker Verification</span>
                  </h3>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    Brokers verified by the platform receive a 🛡️ blue badge on map markers and detail sheets to build buyer trust.
                  </p>

                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-blue-900">Verified Brokers:</span>
                      <span className="text-blue-600 font-black">
                        {usersList.filter((u) => u.is_verified).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-600">Unverified Brokers:</span>
                      <span className="text-gray-900 font-black">
                        {usersList.filter((u) => u.userType === 'broker' && !u.is_verified).length}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('users')}
                  className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                >
                  Manage & Verify Brokers →
                </button>
              </div>
            </div>

            {/* Recent Inquiries Activity Log */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                    Recent Digital Handshake Inquiries
                  </h3>
                  <p className="text-xs text-gray-500">
                    Audit log of buyers contacting brokers with commission protection
                  </p>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {inquiries.length} logged
                </span>
              </div>

              {inquiries.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No inquiries logged yet. When buyers contact brokers, records will appear here.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {inquiries.slice(0, 5).map((inq, idx) => (
                    <div key={inq.id || idx} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            inq.contact_method === 'whatsapp'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {inq.contact_method === 'whatsapp' ? (
                            <MessageCircle size={15} />
                          ) : (
                            <Phone size={15} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            Buyer Phone: <span className="font-mono text-blue-600">{inq.buyer_phone || 'Direct'}</span>
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Property ID: <span className="font-mono">{inq.property_id}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                          {inq.contact_method}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {inq.created_at ? new Date(inq.created_at).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: MANAGE LISTINGS (Requirement 4) */}
        {activeTab === 'listings' && (
          <div className="p-6 space-y-4 max-w-7xl">
            {/* Toolbar: Search and Filter */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  placeholder="Search listings by title, seller, or location..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={14} className="text-gray-400 shrink-0" />
                <select
                  value={listingCategoryFilter}
                  onChange={(e) => setListingCategoryFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="all">All Categories</option>
                  <option value="real_estate">🏠 Real Estate</option>
                  <option value="vehicles">🚗 Vehicles</option>
                  <option value="electronics">📱 Electronics</option>
                  <option value="others">📦 Others</option>
                </select>
              </div>
            </div>

            {/* Listings Data Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-black uppercase tracking-wider text-gray-500">
                      <th className="py-3.5 px-4">Item</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Seller</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredListings.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-gray-400">
                          No listings found matching your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredListings.map((item) => {
                        const hasImg = item.imageUrls && item.imageUrls.length > 0;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                            {/* Image Thumbnail & Title */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                                  {hasImg ? (
                                    <img
                                      src={item.imageUrls[0]}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                      <Layers size={18} />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 max-w-xs">
                                  <p className="font-bold text-gray-900 truncate" title={item.title}>
                                    {item.title}
                                  </p>
                                  <p className="text-[11px] text-gray-500 truncate">
                                    📍 {item.locationName}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800 inline-flex items-center gap-1 capitalize">
                                <span>
                                  {item.mainCategory === 'real_estate' && '🏠'}
                                  {item.mainCategory === 'vehicles' && '🚗'}
                                  {item.mainCategory === 'electronics' && '📱'}
                                  {item.mainCategory === 'others' && '📦'}
                                </span>
                                <span>{item.mainCategory.replace('_', ' ')}</span>
                              </span>
                            </td>

                            {/* Price */}
                            <td className="py-3 px-4">
                              <p className="font-black text-gray-950">
                                Rs {item.price?.toLocaleString()}
                              </p>
                              {item.priceTag && (
                                <span className="text-[10px] text-gray-400 font-bold">
                                  Rs {item.priceTag}
                                </span>
                              )}
                            </td>

                            {/* Seller Name & Type */}
                            <td className="py-3 px-4">
                              <p className="font-bold text-gray-900 flex items-center gap-1">
                                <span>{item.sellerName}</span>
                                {item.sellerType === 'broker' && item.isVerified && (
                                  <span title="Verified Broker" className="text-blue-600">
                                    🛡️
                                  </span>
                                )}
                              </p>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                  item.sellerType === 'owner'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {item.sellerType || 'owner'}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="py-3 px-4 text-gray-500 text-[11px]">
                              {typeof item.createdAt === 'number'
                                ? new Date(item.createdAt).toLocaleDateString()
                                : String(item.createdAt).slice(0, 10)}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleViewOnMap(item)}
                                  className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                                  title="Center on map & open details"
                                >
                                  <MapPin size={13} className="text-blue-600" />
                                  <span>View</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteListing(item.id)}
                                  className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                  title="Delete listing"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: MANAGE USERS (Requirement 5) */}
        {activeTab === 'users' && (
          <div className="p-6 space-y-4 max-w-7xl">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users by name, email, or phone..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={14} className="text-gray-400 shrink-0" />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="all">All Roles</option>
                  <option value="broker">Brokers</option>
                  <option value="owner">Owners</option>
                  <option value="dealer">Dealers</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
            </div>

            {/* Users Data Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-black uppercase tracking-wider text-gray-500">
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Contact Phone</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Verified Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-gray-400">
                          No users found matching your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((target) => (
                        <tr key={target.id} className="hover:bg-gray-50/60 transition-colors">
                          {/* Name & Avatar */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {target.avatar_url || target.avatarUrl ? (
                                <img
                                  src={target.avatar_url || target.avatarUrl}
                                  alt={target.name || 'User'}
                                  className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-200"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                  {target.name ? target.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-gray-900 flex items-center gap-1.5">
                                  <span>{target.name}</span>
                                  {target.is_admin && (
                                    <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                      Admin
                                    </span>
                                  )}
                                </p>
                                {target.company && (
                                  <p className="text-[11px] text-gray-400">{target.company}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="py-3 px-4 font-mono font-semibold text-gray-800">
                            {target.phone || <span className="text-gray-300">N/A</span>}
                          </td>

                          {/* Email */}
                          <td className="py-3 px-4 text-gray-600">
                            {target.email}
                          </td>

                          {/* User Type */}
                          <td className="py-3 px-4">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${
                                target.userType === 'broker'
                                  ? 'bg-blue-100 text-blue-800'
                                  : target.userType === 'dealer'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {target.userType || 'owner'}
                            </span>
                          </td>

                          {/* Verified Status */}
                          <td className="py-3 px-4">
                            {target.is_verified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                <span>🛡️</span>
                                <span>Verified Broker</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                                <span>Unverified</span>
                              </span>
                            )}
                          </td>

                          {/* Actions: [Toggle Verified] and [Delete User] */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Toggle Verified button */}
                              <button
                                onClick={() => handleToggleVerified(target)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 ${
                                  target.is_verified
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                                }`}
                                title="Toggle verified status for this broker"
                              >
                                <ShieldCheck size={13} />
                                <span>
                                  {target.is_verified ? 'Revoke 🛡️' : 'Verify 🛡️'}
                                </span>
                              </button>

                              {/* Delete User button */}
                              <button
                                onClick={() => handleDeleteUser(target.id)}
                                className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                title="Delete user profile"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
