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
  Mail,
  Clock,
  Layers,
  Filter,
  AlertTriangle,
  Loader2,
  Sparkles,
  Maximize2,
  Eye,
  Check,
  X,
  FileCheck,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  updateListing,
  deleteListing,
  isListingPremiumActive,
} from '../lib/storage';
import { getOptimizedImageUrl } from '../utils/cloudinary';

const CATEGORY_ICONS = {
  real_estate: '🏠',
  vehicles: '🚗',
  electronics: '📱',
  services: '🛠️',
  others: '📦',
};

export default function AdminDashboard({
  user,
  profile,
  onBack,
  onSelectListing,
}) {
  const navigate = useNavigate();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('approvals'); // 'approvals' | 'overview' | 'listings' | 'users'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Core stats states as requested
  const [totalListings, setTotalListings] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState([]);

  // Data states
  const [allListings, setAllListings] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    activePremium: 0,
    pendingApprovals: 0,
  });

  // Modal for Viewing Full-Size Bank Slip
  const [selectedSlipListing, setSelectedSlipListing] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  const isValidUuid = (id) => {
    return (
      typeof id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    );
  };

  // Robust Admin Data Fetching (Listings, Profiles, Pending Approvals)
  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    setRefreshing(true);
    try {
      if (!isSupabaseConfigured || !supabase) {
        console.warn('Supabase is not configured.');
        setError('Supabase is not configured. Please check your environment variables.');
        setTotalListings(0);
        setTotalUsers(0);
        setPendingApprovals([]);
        setPendingListings([]);
        setAllListings([]);
        setUsersList([]);
        setStats({
          totalUsers: 0,
          totalListings: 0,
          activePremium: 0,
          pendingApprovals: 0,
        });
        return;
      }

      // Fetch 1: All listings
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('*');

      // Fetch 2: All profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (listingsError || profilesError) {
        const errMsg = listingsError?.message || profilesError?.message || 'Failed to fetch admin data';
        console.error('AdminDashboard fetch error:', listingsError || profilesError);
        setError(errMsg);
        return;
      }

      // Filter the listings array in Javascript to find pending approvals
      const validListings = listings || [];
      const validProfiles = profiles || [];
      const pending = validListings.filter((l) => l.premium_status === 'pending');

      // Update states as requested
      setTotalListings(validListings.length);
      setTotalUsers(validProfiles.length);
      setPendingApprovals(pending);

      // Keep listing & user collections in sync
      setAllListings(validListings);
      setPendingListings(pending);
      setUsersList(validProfiles);
      setStats({
        totalUsers: validProfiles.length,
        totalListings: validListings.length,
        activePremium: validListings.filter(isListingPremiumActive).length,
        pendingApprovals: pending.length,
      });
    } catch (err) {
      console.error('Failed to load admin dashboard data from Supabase:', err);
      setError(err.message || 'Unexpected error fetching admin data');
      setPendingApprovals([]);
      setPendingListings([]);
      setAllListings([]);
      setUsersList([]);
      setTotalListings(0);
      setTotalUsers(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Quick lookup map for user profiles
  const profilesMap = useMemo(() => {
    const map = {};
    usersList.forEach((u) => {
      map[u.id] = u;
      if (u.uid) map[u.uid] = u;
    });
    return map;
  }, [usersList]);

  // Handle Approve Action (14-day expiry)
  const handleApprove = async (listingId, title) => {
    setActionLoadingId(listingId);
    try {
      if (!listingId) {
        console.error('Approval failed: listingId is null or undefined.');
        toast.error('Listing ID is missing.');
        return;
      }

      // Ensure handleApprove uses the real Supabase UUID from the database
      if (!isValidUuid(listingId)) {
        console.error(`Invalid Supabase UUID format: "${listingId}" for listing "${title}"`);
        toast.error(`Invalid UUID format: "${listingId}". Database update skipped.`);
        return;
      }

      // Set premium_expires_at to exactly 14 days from current date
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      if (isSupabaseConfigured && supabase) {
        const { error: updateError } = await supabase
          .from('listings')
          .update({
            is_premium: true,
            premium_status: 'approved',
            premium_expires_at: expiresAt,
          })
          .eq('id', listingId);

        if (updateError) {
          console.error('Supabase error updating listing in handleApprove:', updateError);
          toast.error('Failed to approve listing: ' + updateError.message);
          // IMPORTANT: Do NOT remove the item from the UI state if the update fails
          return;
        }
      }

      // Sync local storage & subscribers safely
      try {
        await updateListing(listingId, {
          is_premium: true,
          isPremium: true,
          premium_status: 'approved',
          premiumStatus: 'approved',
          premium_expires_at: expiresAt,
          premiumExpiresAt: expiresAt,
        });
      } catch (storageErr) {
        console.error('Storage sync error:', storageErr);
      }

      // Update UI state ONLY on successful database update
      setPendingApprovals((prev) => prev.filter((item) => item.id !== listingId));
      setPendingListings((prev) => prev.filter((item) => item.id !== listingId));
      setAllListings((prev) =>
        prev.map((item) =>
          item.id === listingId
            ? {
                ...item,
                is_premium: true,
                isPremium: true,
                premium_status: 'approved',
                premiumStatus: 'approved',
                premium_expires_at: expiresAt,
                premiumExpiresAt: expiresAt,
              }
            : item
        )
      );
      setStats((prev) => ({
        ...prev,
        pendingApprovals: Math.max(0, prev.pendingApprovals - 1),
        activePremium: prev.activePremium + 1,
      }));

      toast.success(`Approved Golden Pin for "${title}"! Valid for 14 days.`, {
        icon: '⭐',
        duration: 4000,
      });

      if (selectedSlipListing?.id === listingId) {
        setSelectedSlipListing(null);
      }
    } catch (err) {
      console.error('Approval failed:', err);
      toast.error('Failed to approve listing: ' + (err.message || 'Please try again.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Action
  const handleReject = async (listingId, title) => {
    setActionLoadingId(listingId);
    try {
      if (!listingId) {
        console.error('Rejection failed: listingId is null or undefined.');
        toast.error('Listing ID is missing.');
        return;
      }

      // Ensure handleReject uses the real Supabase UUID from the database
      if (!isValidUuid(listingId)) {
        console.error(`Invalid Supabase UUID format: "${listingId}" for listing "${title}"`);
        toast.error(`Invalid UUID format: "${listingId}". Database update skipped.`);
        return;
      }

      if (isSupabaseConfigured && supabase) {
        const { error: updateError } = await supabase
          .from('listings')
          .update({
            is_premium: false,
            premium_status: 'rejected',
          })
          .eq('id', listingId);

        if (updateError) {
          console.error('Supabase error updating listing in handleReject:', updateError);
          toast.error('Failed to reject listing: ' + updateError.message);
          // IMPORTANT: Do NOT remove the item from the UI state if the update fails
          return;
        }
      }

      // Sync local storage & subscribers safely
      try {
        await updateListing(listingId, {
          is_premium: false,
          isPremium: false,
          premium_status: 'rejected',
          premiumStatus: 'rejected',
        });
      } catch (storageErr) {
        console.error('Storage sync error:', storageErr);
      }

      // Update UI state ONLY on successful database update
      setPendingApprovals((prev) => prev.filter((item) => item.id !== listingId));
      setPendingListings((prev) => prev.filter((item) => item.id !== listingId));
      setAllListings((prev) =>
        prev.map((item) =>
          item.id === listingId
            ? { ...item, is_premium: false, isPremium: false, premium_status: 'rejected' }
            : item
        )
      );
      setStats((prev) => ({
        ...prev,
        pendingApprovals: Math.max(0, prev.pendingApprovals - 1),
      }));

      toast.error(`Rejected Golden Pin request for "${title}".`, {
        icon: '❌',
        duration: 4000,
      });

      if (selectedSlipListing?.id === listingId) {
        setSelectedSlipListing(null);
      }
    } catch (err) {
      console.error('Rejection failed:', err);
      toast.error('Failed to reject listing: ' + (err.message || 'Please try again.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered pending listings
  const filteredPending = useMemo(() => {
    return pendingApprovals.filter((l) => {
      if (categoryFilter !== 'all' && (l.main_category || l.mainCategory) !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const t = (l.title || '').toLowerCase();
        const seller = (l.seller_name || l.sellerName || '').toLowerCase();
        return t.includes(q) || seller.includes(q);
      }
      return true;
    });
  }, [pendingApprovals, categoryFilter, searchQuery]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[50vh]">
        <Toaster position="top-right" />
        <Loader2 size={44} className="animate-spin text-amber-500 mb-4" />
        <h3 className="text-base font-bold text-gray-900">Loading Admin Dashboard...</h3>
        <p className="text-xs text-gray-500 mt-1">Fetching platform data and pending approvals...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Toaster position="top-right" />

      {/* Admin Content Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Return to Main Map"
          >
            <ArrowLeft size={16} />
            <span className="text-xs font-bold">Back to Map</span>
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight flex items-center gap-2">
              <span>👑 Admin Dashboard</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Live Control
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Verify Golden Pin bank slips (14-day validity), manage platform moderation, and inspect statistics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAdminData}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh all data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-amber-600' : ''} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Prominent Red Error Box if database query failed */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-400 text-red-900 shadow-sm flex items-start gap-3.5 animate-in fade-in">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={22} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-red-950 flex items-center gap-1.5">
                <span>Database Query Error</span>
              </h4>
              <button
                type="button"
                onClick={fetchAdminData}
                className="text-xs font-bold text-red-700 hover:text-red-950 underline cursor-pointer"
              >
                Retry Fetch
              </button>
            </div>
            <p className="text-xs font-mono font-medium mt-1.5 text-red-800 break-all bg-red-100/70 p-2.5 rounded-xl border border-red-200">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* 1. Platform Stats Section */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
          Platform Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Total Users */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
              <Users size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-semibold truncate">Total Users</p>
              <p className="text-2xl font-black text-gray-900 mt-0.5">
                {totalUsers.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Total Listings */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0">
              <MapPin size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-semibold truncate">Total Listings</p>
              <p className="text-2xl font-black text-gray-900 mt-0.5">
                {totalListings.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Active Premium Listings */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50/50 p-4 rounded-2xl border border-amber-200 shadow-xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-400 text-slate-950 flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              ⭐
            </div>
            <div className="min-w-0">
              <p className="text-xs text-amber-900 font-bold truncate">Active Golden Pins</p>
              <p className="text-2xl font-black text-amber-950 mt-0.5">
                {stats.activePremium.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Pending Approvals */}
          <div
            className={`p-4 rounded-2xl border shadow-xs flex items-center gap-3.5 transition-all ${
              pendingApprovals.length > 0
                ? 'bg-amber-100/60 border-amber-300 ring-2 ring-amber-400/20'
                : 'bg-white border-gray-200/80'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
              <Clock size={22} className={pendingApprovals.length > 0 ? 'animate-pulse' : ''} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-amber-900 font-bold truncate">Pending Approvals</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-black text-amber-950">
                  {pendingApprovals.length.toLocaleString()}
                </span>
                {pendingApprovals.length > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full animate-bounce">
                    Action Needed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'approvals'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white hover:bg-gray-100 text-gray-600'
          }`}
        >
          <span>⭐ Golden Pin Approvals</span>
          {pendingApprovals.length > 0 && (
            <span className="bg-slate-950 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
              {pendingApprovals.length}
            </span>
          )}
        </button>

          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'listings'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white hover:bg-gray-100 text-gray-600'
            }`}
          >
            <span>📋 All Listings ({allListings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white hover:bg-gray-100 text-gray-600'
            }`}
          >
            <span>👥 Platform Users ({usersList.length})</span>
          </button>
        </div>

        {/* TAB 1: GOLDEN PIN APPROVALS (Core Feature) */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            {/* Header & Filter Controls */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <span>Golden Pin Bank Transfer Requests</span>
                  <span className="text-xs font-bold text-gray-500">
                    ({filteredPending.length} pending verification)
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verify the uploaded bank receipt against Selinmap's bank accounts, then Approve or Reject.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 sm:w-60">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title or owner..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Category filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50 outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="vehicles">Vehicles</option>
                  <option value="electronics">Electronics</option>
                  <option value="services">Services</option>
                  <option value="others">Others</option>
                </select>
              </div>
            </div>

            {/* List or Table */}
            {filteredPending.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-gray-200/80 text-center shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  No pending approvals at the moment.
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  There are currently no pending Golden Pin bank transfer slips awaiting approval. New requests will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredPending.map((item) => {
                  const slipUrl = item.payment_slip_url || item.paymentSlipUrl;
                  const owner =
                    profilesMap[item.user_id || item.seller_id || item.sellerId] || {};
                  const ownerName =
                    owner.full_name ||
                    owner.name ||
                    item.seller_name ||
                    item.sellerName ||
                    'Anonymous Seller';
                  const ownerPhone =
                    owner.phone ||
                    item.seller_phone ||
                    item.sellerPhone ||
                    item.phone ||
                    'N/A';
                  const ownerEmail = owner.email || 'N/A';
                  const cat = item.main_category || item.mainCategory || 'others';
                  const catIcon = CATEGORY_ICONS[cat] || '📦';
                  const isActionLoading = actionLoadingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-amber-200 shadow-xs hover:shadow-md transition-all p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      {/* Left: Slip Thumbnail & Listing Overview */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        {/* Clickable Bank Slip Thumbnail */}
                        <div
                          onClick={() => setSelectedSlipListing(item)}
                          className="relative w-24 h-24 rounded-2xl overflow-hidden bg-amber-50 border-2 border-amber-300 group cursor-pointer shrink-0 shadow-xs"
                          title="Click to view full-size payment slip"
                        >
                          <img
                            src={getOptimizedImageUrl(slipUrl, 'thumbnail')}
                            alt="Payment Slip"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye size={20} />
                          </div>
                          <span className="absolute bottom-1 right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow-xs">
                            SLIP
                          </span>
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                              <span>{catIcon}</span>
                              <span className="capitalize">{cat.replace('_', ' ')}</span>
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              ID: {String(item.id).slice(0, 8)}...
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-gray-900 truncate">
                            {item.title}
                          </h4>

                          <p className="text-sm font-black text-emerald-600 mt-0.5">
                            Rs. {Number(item.price).toLocaleString()}
                            {item.price_tag || item.priceTag ? (
                              <span className="text-xs text-gray-400 font-semibold ml-1.5">
                                ({item.price_tag || item.priceTag})
                              </span>
                            ) : null}
                          </p>

                          {/* Owner details */}
                          <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-600">
                            <span className="font-semibold text-gray-900 flex items-center gap-1">
                              <span>👤</span>
                              <span>{ownerName}</span>
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <Phone size={12} className="text-gray-400" />
                              <span>{ownerPhone}</span>
                            </span>
                            {ownerEmail !== 'N/A' && (
                              <span className="flex items-center gap-1 text-gray-500">
                                <Mail size={12} className="text-gray-400" />
                                <span>{ownerEmail}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex sm:flex-col lg:flex-row items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 shrink-0">
                        {/* View Slip Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedSlipListing(item)}
                          className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                          <Maximize2 size={13} />
                          <span>View Slip</span>
                        </button>

                        {/* Approve Button (Green) */}
                        <button
                          type="button"
                          onClick={() => handleApprove(item.id, item.title)}
                          disabled={isActionLoading}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
                        >
                          {isActionLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} className="stroke-[3]" />
                          )}
                          <span>Approve</span>
                        </button>

                        {/* Reject Button (Red) */}
                        <button
                          type="button"
                          onClick={() => handleReject(item.id, item.title)}
                          disabled={isActionLoading}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
                        >
                          {isActionLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <X size={14} className="stroke-[3]" />
                          )}
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ALL LISTINGS */}
        {activeTab === 'listings' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-gray-900">
                All Listings on Selinmap ({allListings.length})
              </h3>
            </div>

            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {allListings.map((listing) => {
                const isPrem = Boolean(listing.is_premium || listing.isPremium);
                const thumb =
                  listing.image_urls?.[0] ||
                  listing.imageUrls?.[0] ||
                  'https://selinmap.com/pin-logo.svg';

                return (
                  <div
                    key={listing.id}
                    className="p-3.5 hover:bg-gray-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getOptimizedImageUrl(thumb, 'thumbnail')}
                        alt={listing.title}
                        className="w-12 h-12 rounded-xl object-cover bg-gray-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isPrem && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                              ⭐ GOLD
                            </span>
                          )}
                          <h4 className="font-bold text-gray-900 truncate">{listing.title}</h4>
                        </div>
                        <p className="text-gray-500 mt-0.5">
                          Rs. {Number(listing.price).toLocaleString()} •{' '}
                          <span className="capitalize">{listing.main_category || listing.mainCategory}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onSelectListing && (
                        <button
                          type="button"
                          onClick={() => {
                            handleGoBack();
                            onSelectListing(listing);
                          }}
                          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600"
                          title="View on Map"
                        >
                          <ExternalLink size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM USERS */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">
                Registered Users & Profiles ({usersList.length})
              </h3>
            </div>

            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {usersList.map((userRow) => (
                <div
                  key={userRow.id}
                  className="p-3.5 hover:bg-gray-50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 text-white font-bold flex items-center justify-center">
                      {(userRow.full_name || userRow.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 flex items-center gap-1.5">
                        <span>{userRow.full_name || userRow.name || 'Anonymous'}</span>
                        {userRow.is_admin && (
                          <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                            ADMIN
                          </span>
                        )}
                      </p>
                      <p className="text-gray-500 text-[11px]">{userRow.email || 'No email'}</p>
                    </div>
                  </div>

                  <span className="capitalize font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full text-[11px]">
                    {userRow.user_type || userRow.userType || 'owner'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* FULL-SIZE BANK SLIP VIEWER MODAL */}
      {selectedSlipListing && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setSelectedSlipListing(null)}
          />

          {/* Modal Card */}
          <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-amber-600" />
                <div>
                  <h3 className="text-sm font-black text-gray-900 leading-tight">
                    Verify Bank Transfer Slip
                  </h3>
                  <p className="text-[11px] text-gray-500 truncate max-w-sm">
                    {selectedSlipListing.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSlipListing(null)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Slip Image Full-Size Container */}
            <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-gray-950/5 min-h-[300px]">
              {selectedSlipListing.payment_slip_url || selectedSlipListing.paymentSlipUrl ? (
                <div className="max-h-[60vh] max-w-full overflow-auto rounded-xl shadow-md border border-gray-200 bg-white p-2">
                  <img
                    src={selectedSlipListing.payment_slip_url || selectedSlipListing.paymentSlipUrl}
                    alt="Full Bank Slip"
                    className="max-h-[55vh] w-auto object-contain rounded-lg mx-auto"
                  />
                </div>
              ) : (
                <p className="text-xs text-gray-400">No slip image URL found.</p>
              )}

              {/* Transaction details card */}
              <div className="w-full mt-3 p-3 bg-white border border-gray-200 rounded-2xl text-xs grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px]">Listing Price</span>
                  <span className="font-extrabold text-emerald-700">
                    Rs. {Number(selectedSlipListing.price).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px]">Owner / Seller</span>
                  <span className="font-bold text-gray-900 truncate block">
                    {selectedSlipListing.seller_name || selectedSlipListing.sellerName || 'Anonymous'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px]">Contact Phone</span>
                  <span className="font-bold text-gray-900 truncate block">
                    {selectedSlipListing.seller_phone || selectedSlipListing.sellerPhone || selectedSlipListing.phone || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Approve / Reject */}
            <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between gap-3 shrink-0">
              <a
                href={selectedSlipListing.payment_slip_url || selectedSlipListing.paymentSlipUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <span>Open Original Image</span>
                <ExternalLink size={12} />
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleReject(selectedSlipListing.id, selectedSlipListing.title)}
                  disabled={actionLoadingId === selectedSlipListing.id}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {actionLoadingId === selectedSlipListing.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <X size={14} className="stroke-[3]" />
                  )}
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(selectedSlipListing.id, selectedSlipListing.title)}
                  disabled={actionLoadingId === selectedSlipListing.id}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
                >
                  {actionLoadingId === selectedSlipListing.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} className="stroke-[3]" />
                  )}
                  <span>Approve Golden Pin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
