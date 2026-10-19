import { useState, useRef, useEffect } from 'react';
import { Menu, User, Star, Crown, LogOut, LogIn } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from '../lib/auth';

export default function UserMenu({
  user,
  profile,
  onOpenProfile,
  onOpenMyListings,
  onOpenAuth,
  onSignOut,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = Boolean(profile?.is_admin || user?.user_metadata?.is_admin || user?.is_admin);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Logout
  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await signOut();
    } catch (err) {
      console.warn('SignOut error:', err);
    }
    if (onSignOut) {
      onSignOut();
    }
  };

  // If user is not logged in: show a sleek Login pill button
  if (!user) {
    return (
      <button
        onClick={onOpenAuth}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-950 px-3.5 py-1.5 rounded-full hover:bg-gray-100 border border-gray-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
      >
        <LogIn size={14} className="stroke-[1.75]" />
        <span>Log In</span>
      </button>
    );
  }

  // User is logged in: Airbnb-style sleek unified pill
  const initial = profile?.name
    ? profile.name.charAt(0).toUpperCase()
    : user.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  const avatarUrl = profile?.avatar_url || profile?.avatarUrl;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-full border border-gray-200/90 hover:border-gray-300 hover:shadow-xs transition-all bg-white cursor-pointer select-none group active:scale-95"
        aria-label="User account menu"
      >
        <Menu size={15} className="text-gray-600 group-hover:text-gray-900 transition-colors stroke-[2]" />
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-2xs overflow-hidden ring-1 ring-black/5 shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={profile?.name || 'Avatar'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 py-1.5 z-[2000] animate-in fade-in zoom-in-95 duration-150">
          {/* User Profile Card */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-900 truncate">
              {profile?.name || 'My Account'}
            </p>
            <p className="text-[11px] text-gray-500 truncate mt-0.5">
              {user.email}
            </p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                👑 Administrator
              </span>
            )}
          </div>

          {/* Menu Actions */}
          <div className="py-1 text-xs">
            {/* My Ads & Golden Pins */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenMyListings();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-left font-medium text-gray-700 hover:text-gray-950 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Star size={15} className="text-amber-500 fill-amber-500 shrink-0" />
              <div className="flex-1">
                <span>My Ads & Golden Pins</span>
              </div>
            </button>

            {/* Admin Dashboard (if admin) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (location.pathname === '/admin') {
                    navigate('/');
                  } else {
                    navigate('/admin');
                  }
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-left font-medium text-amber-900 hover:bg-amber-50/70 transition-colors cursor-pointer"
              >
                <Crown size={15} className="text-amber-600 shrink-0" />
                <span>
                  {location.pathname === '/admin' ? 'Back to Map' : 'Admin Dashboard'}
                </span>
              </button>
            )}

            {/* Profile Settings */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenProfile();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-left font-medium text-gray-700 hover:text-gray-950 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <User size={15} className="text-gray-400 shrink-0" />
              <span>Account & Profile</span>
            </button>
          </div>

          <div className="border-t border-gray-100 py-1 text-xs">
            {/* Sign Out */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-left font-medium text-red-600 hover:bg-red-50/60 transition-colors cursor-pointer"
            >
              <LogOut size={15} className="shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
