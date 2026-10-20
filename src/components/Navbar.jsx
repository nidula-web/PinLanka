import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Map } from 'lucide-react';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

export default function Navbar({
  user,
  profile,
  onAddClick,
  onOpenMyListings,
  onOpenProfile,
  onOpenAuth,
  onSignOut,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="h-14 px-4 sm:px-6 flex items-center justify-between">
      <Link
        to="/"
        className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none group"
        title="Return to Home"
      >
        <img
          src="/pin-logo.svg"
          alt="Sellinmap Logo"
          className="w-8 h-8 object-contain shrink-0 transition-transform group-hover:scale-105"
        />
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold tracking-tight text-blue-600">
            Sellin<span className="text-emerald-600">map</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] font-bold text-gray-400 border-l border-gray-200 pl-2 uppercase tracking-wider">
            Marketplace
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* If on /admin, quick Back to Map button */}
        {location.pathname === '/admin' && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-950 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full border border-gray-200 transition-all cursor-pointer"
            title="Return to Map"
          >
            <Map size={14} />
            <span className="hidden sm:inline">Back to Map</span>
          </button>
        )}

        {/* Desktop shortcut to My Ads (clean, subtle text link without heavy gradients) */}
        {user && location.pathname !== '/admin' && (
          <button
            onClick={onOpenMyListings}
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            title="My Ads & Golden Pins"
          >
            <span className="text-amber-500">⭐</span>
            <span>My Ads</span>
          </button>
        )}

        {/* Notification Bell */}
        <NotificationBell user={user} />

        {/* Post Ad Button */}
        <button
          onClick={onAddClick}
          className="flex items-center gap-1.5 bg-gray-950 hover:bg-gray-800 active:scale-95 text-white text-xs font-bold px-3.5 sm:px-4 py-1.5 rounded-full shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <Plus size={15} strokeWidth={2.2} />
          <span>Post Ad</span>
        </button>

        {/* Unified User Menu (Airbnb style) */}
        <UserMenu
          user={user}
          profile={profile}
          onOpenProfile={onOpenProfile}
          onOpenMyListings={onOpenMyListings}
          onOpenAuth={onOpenAuth}
          onSignOut={onSignOut}
        />
      </div>
    </div>
  );
}
