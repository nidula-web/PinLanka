import { supabase, isSupabaseConfigured } from './supabase';

// --- Local fallback state & helpers ---
const LOCAL_USER_KEY = 'pinlanka_local_user';
const LOCAL_PROFILES_KEY = 'pinlanka_local_profiles';
const authListeners = new Set();

function getLocalUser() {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalUser(user) {
  try {
    if (user) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  } catch {
    // Ignore storage quota
  }
  authListeners.forEach((cb) => cb(user));
}

function getLocalProfiles() {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalProfile(uid, profileData) {
  try {
    const all = getLocalProfiles();
    all[uid] = { ...(all[uid] || {}), ...profileData, uid, id: uid };
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(all));
  } catch {
    // Ignore storage quota
  }
}

// --- Auth helpers with Supabase ---

export function onAuthChange(callback) {
  if (isSupabaseConfigured && supabase) {
    // 1. Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user || null;
      if (user) user.uid = user.id;
      callback(user);
    });

    // 2. Real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user || null;
        if (user) user.uid = user.id;
        callback(user);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }

  // Local mode listener
  authListeners.add(callback);
  setTimeout(() => {
    callback(getLocalUser());
  }, 0);

  return () => {
    authListeners.delete(callback);
  };
}

export async function signUp(email, password, { fullName = '', phoneNumber = '' } = {}) {
  if (isSupabaseConfigured && supabase) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phoneNumber,
          user_type: 'owner',
        },
      },
    });
    if (authError) throw authError;

    if (authData.user) {
      authData.user.uid = authData.user.id;
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: email,
            full_name: fullName,
            phone: phoneNumber,
          },
        ]);
      if (profileError) {
        console.warn('Profile table insert warning:', profileError.message);
      }
    }
    return authData.user;
  }

  // Local fallback mode
  const uid = 'local_user_' + Math.random().toString(36).substring(2, 9);
  const user = {
    id: uid,
    uid,
    email,
    user_metadata: { full_name: fullName, phone: phoneNumber, user_type: 'owner' },
  };
  setLocalUser(user);
  setLocalProfile(uid, {
    id: uid,
    uid,
    email,
    name: fullName,
    full_name: fullName,
    phone: phoneNumber,
    userType: 'owner',
  });
  return user;
}

export async function signIn(email, password) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) data.user.uid = data.user.id;
    return data.user;
  }

  // Local fallback mode
  const uid = 'local_user_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  const user = { id: uid, uid, email };
  setLocalUser(user);
  return user;
}

export async function signOut() {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) console.warn('Supabase signOut warning:', error);
    return;
  }

  setLocalUser(null);
}

// --- Profile helpers with Supabase ---

export async function getProfile(userId) {
  if (!userId) return null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data && !error) {
        return {
          id: data.id,
          uid: data.id,
          name: data.full_name || data.name || '',
          full_name: data.full_name || data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          userType: data.user_type || data.userType || 'owner',
          company: data.company || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || data.avatarUrl || '',
          avatarUrl: data.avatar_url || data.avatarUrl || '',
          is_admin: Boolean(data.is_admin || data.isAdmin),
          is_verified: Boolean(data.is_verified || data.isVerified),
        };
      } else {
        // Fallback to active user session metadata if available
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user && (userData.user.id === userId || userData.user.uid === userId)) {
          const meta = userData.user.user_metadata || {};
          if (meta.full_name || meta.phone || meta.is_admin || meta.bio || meta.avatar_url) {
            return {
              id: userData.user.id,
              uid: userData.user.id,
              name: meta.full_name || '',
              full_name: meta.full_name || '',
              email: userData.user.email || '',
              phone: meta.phone || '',
              userType: meta.user_type || 'owner',
              company: '',
              bio: meta.bio || '',
              avatar_url: meta.avatar_url || meta.avatarUrl || '',
              avatarUrl: meta.avatar_url || meta.avatarUrl || '',
              is_admin: Boolean(meta.is_admin || meta.isAdmin),
              is_verified: Boolean(meta.is_verified || meta.isVerified),
            };
          }
        }
      }
    } catch (err) {
      console.warn('Supabase getProfile error, falling back to local:', err);
    }
  }

  // Local mode fallback
  const all = getLocalProfiles();
  return all[userId] || null;
}

export async function saveProfile(userId, data) {
  if (!userId) return;

  if (isSupabaseConfigured && supabase) {
    try {
      const updatePayload = {};
      if (data.name !== undefined) updatePayload.full_name = data.name;
      if (data.full_name !== undefined) updatePayload.full_name = data.full_name;
      if (data.phone !== undefined) updatePayload.phone = data.phone;
      if (data.company !== undefined) updatePayload.company = data.company;
      if (data.userType !== undefined) updatePayload.user_type = data.userType;
      if (data.bio !== undefined) updatePayload.bio = data.bio;
      if (data.avatar_url !== undefined) updatePayload.avatar_url = data.avatar_url;
      if (data.avatarUrl !== undefined) updatePayload.avatar_url = data.avatarUrl;

      await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase saveProfile error, saving locally:', err);
    }
  }

  setLocalProfile(userId, data);
}

export async function createUserProfile(userId, profileData) {
  const profileRow = {
    id: userId,
    uid: userId,
    email: profileData.email || '',
    name: profileData.name || profileData.full_name || '',
    full_name: profileData.name || profileData.full_name || '',
    phone: profileData.phone || '',
    userType: profileData.userType || 'owner',
    bio: profileData.bio || '',
    avatar_url: profileData.avatar_url || profileData.avatarUrl || '',
    avatarUrl: profileData.avatar_url || profileData.avatarUrl || '',
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('profiles').insert([
        {
          id: userId,
          email: profileData.email,
          full_name: profileData.name || profileData.full_name,
          phone: profileData.phone,
          bio: profileData.bio || '',
          avatar_url: profileData.avatar_url || profileData.avatarUrl || '',
        },
      ]);
      if (error) {
        console.warn('Supabase insert profile warning:', error.message);
      }
    } catch (err) {
      console.warn('Supabase createUserProfile error, saving locally:', err);
    }
  }

  setLocalProfile(userId, profileRow);
  return profileRow;
}

export async function createProfileIfMissing(userId, email) {
  if (!userId) return null;
  const existing = await getProfile(userId);
  if (!existing) {
    return createUserProfile(userId, {
      email,
      name: email ? email.split('@')[0] : 'Selinmap User',
      phone: '',
      userType: 'owner',
    });
  }
  return existing;
}

/**
 * Validates Sri Lankan mobile numbers:
 * - 07XXXXXXXX (10 digits starting with 07)
 * - +947XXXXXXXX (12 characters)
 * - 947XXXXXXXX (11 digits)
 */
export function validateSriLankanPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Please enter a valid mobile number.' };
  }
  const cleaned = phone.trim().replace(/[\s\-()]/g, '');

  if (!/^\+?\d+$/.test(cleaned)) {
    return { valid: false, message: 'Please enter a valid mobile number.' };
  }

  if (/^07\d{8}$/.test(cleaned)) {
    return { valid: true, formatted: cleaned };
  }

  if (/^\+947\d{8}$/.test(cleaned)) {
    return { valid: true, formatted: cleaned };
  }

  if (/^947\d{8}$/.test(cleaned)) {
    return { valid: true, formatted: '+' + cleaned };
  }

  return { valid: false, message: 'Please enter a valid mobile number.' };
}
