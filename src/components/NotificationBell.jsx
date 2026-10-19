import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Loader2, Sparkles, AlertCircle, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef(null);

  const userId = user?.id || user?.uid;

  // Fetch notifications for the logged in user
  const fetchNotifications = async () => {
    if (!userId || !isSupabaseConfigured || !supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(25);

      if (error) {
        // Table might not exist or schema issue - handle gracefully
        console.warn('Notifications fetch warning:', error.message);
        return;
      }
      setNotifications(data || []);
    } catch (err) {
      console.warn('Notifications fetch exception:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();

      // Realtime subscription for incoming notifications
      if (isSupabaseConfigured && supabase) {
        const channel = supabase
          .channel(`user-notifications-${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            () => {
              fetchNotifications();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    } else {
      setNotifications([]);
    }
  }, [userId]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!userId || unreadCount === 0 || markingAll) return;
    try {
      setMarkingAll(true);
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId)
          .eq('is_read', false);

        if (error) throw error;
      }

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  // Mark a single notification as read
  const handleMarkSingleAsRead = async (id) => {
    if (!id) return;
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.warn('Error marking notification as read:', err);
    }
  };

  if (!user) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell size={18} />

        {/* Red Dot on the bell if there are unread notifications */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white" />
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[2000] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-900 tracking-tight">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <CheckCheck size={13} />
                )}
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-amber-500" />
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
                  <Bell size={18} />
                </div>
                <p className="text-xs font-bold text-gray-700">No notifications yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  You'll be notified when your ads or Golden Pins are updated.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !item.is_read;
                const timeAgo = item.created_at
                  ? new Date(item.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkSingleAsRead(item.id)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 text-xs ${
                      isUnread
                        ? 'bg-amber-50/40 hover:bg-amber-50/70'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isUnread ? (
                        <span className="w-2 h-2 rounded-full bg-amber-500 block ring-2 ring-amber-200" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-300 block" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`truncate text-xs ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                          {item.title || 'Notification'}
                        </h4>
                        <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                          {timeAgo}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                        {item.message || item.body || item.content}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
