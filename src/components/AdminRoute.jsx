import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getProfile } from '../lib/auth';

/**
 * AdminRoute Component
 * Protective route wrapper that verifies the user has an active session
 * and that their profile in the 'profiles' table has is_admin === true.
 * If unauthorized, immediately redirects to home ('/').
 */
export default function AdminRoute({ children, user: propUser, profile: propProfile }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function verifyAdmin() {
      setLoading(true);

      try {
        if (isSupabaseConfigured && supabase) {
          // 1. Check current Supabase session
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !sessionData?.session?.user) {
            if (!isCancelled) {
              setIsAdmin(false);
              setLoading(false);
            }
            return;
          }

          const currentUserId = sessionData.session.user.id;

          // 2. Fetch the user's is_admin status from the profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', currentUserId)
            .maybeSingle();

          if (!isCancelled) {
            if (profileData && profileData.is_admin === true) {
              setIsAdmin(true);
            } else if (
              sessionData.session.user.user_metadata?.is_admin === true ||
              propProfile?.is_admin === true
            ) {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          }
        } else {
          // Local fallback / demo mode check
          const localProfile =
            propProfile || (propUser ? await getProfile(propUser.id || propUser.uid) : null);
          const isLocalAdmin = Boolean(
            localProfile?.is_admin ||
            propUser?.is_admin ||
            localStorage.getItem('pinlanka_demo_admin') === 'true'
          );
          if (!isCancelled) {
            setIsAdmin(isLocalAdmin);
          }
        }
      } catch (err) {
        console.error('AdminRoute verification error:', err);
        if (!isCancelled) {
          setIsAdmin(Boolean(propProfile?.is_admin));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    verifyAdmin();

    return () => {
      isCancelled = true;
    };
  }, [propUser, propProfile]);

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-sm animate-pulse">
          <Loader2 size={32} className="animate-spin text-amber-600" />
        </div>
        <h2 className="text-base font-black text-gray-900 mb-1">
          Verifying Admin Authorization...
        </h2>
        <p className="text-xs text-gray-500">
          Checking your administrator permissions with Sellinmap
        </p>
      </div>
    );
  }

  // If user is not logged in or is_admin is false, redirect to home page
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
