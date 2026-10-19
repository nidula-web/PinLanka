import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Camera,
  Loader2,
  Check,
  Save,
  LogOut,
  User,
  Phone,
  FileText,
  Building,
  Shield,
  Sparkles,
} from 'lucide-react';
import { getProfile, saveProfile, signOut } from '../lib/auth';
import { uploadImage } from '../lib/uploadImage';

const USER_TYPES = [
  { key: 'owner', label: 'Direct Owner', desc: 'Selling personal property' },
  { key: 'broker', label: 'Agent / Broker', desc: 'Licensed property broker' },
  { key: 'dealer', label: 'Dealership', desc: 'Commercial dealer' },
];

export default function UserProfile({ user, onBack, onSignOut, onProfileUpdate, onOpenMyListings }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    userType: 'owner',
    company: '',
    bio: '',
    avatar_url: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);

  // Load existing profile from Supabase profiles table on mount
  useEffect(() => {
    let isMounted = true;
    const uid = user?.id || user?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    getProfile(uid).then((prof) => {
      if (isMounted) {
        if (prof) {
          setForm({
            name: prof.name || prof.full_name || '',
            phone: prof.phone || '',
            userType: prof.userType || prof.user_type || 'owner',
            company: prof.company || '',
            bio: prof.bio || '',
            avatar_url: prof.avatar_url || prof.avatarUrl || '',
          });
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setSaveSuccess(false);
    setErrorMessage('');
  };

  // Upload avatar to Cloudinary via uploadImage helper
  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    setUploadingAvatar(true);
    setErrorMessage('');

    try {
      const secureUrl = await uploadImage(file);
      if (secureUrl) {
        setForm((prev) => ({ ...prev, avatar_url: secureUrl }));
        // Auto save avatar to profile table immediately
        const uid = user?.id || user?.uid;
        if (uid) {
          await saveProfile(uid, { avatar_url: secureUrl, avatarUrl: secureUrl });
          if (onProfileUpdate) {
            onProfileUpdate({ ...form, avatar_url: secureUrl, avatarUrl: secureUrl });
          }
        }
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      setErrorMessage('Failed to upload image. Please try again.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save changes to Supabase profiles table
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const uid = user?.id || user?.uid;
    if (!uid) return;

    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const updateData = {
        name: form.name.trim(),
        full_name: form.name.trim(),
        phone: form.phone.trim(),
        userType: form.userType,
        user_type: form.userType,
        company: form.company.trim(),
        bio: form.bio.trim(),
        avatar_url: form.avatar_url,
        avatarUrl: form.avatar_url,
      };

      await saveProfile(uid, updateData);
      setSaveSuccess(true);

      if (onProfileUpdate) {
        onProfileUpdate({
          id: uid,
          uid,
          ...updateData,
          email: user?.email,
        });
      }

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save profile error:', err);
      setErrorMessage(err.message || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    if (onSignOut) onSignOut();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[5000] bg-white flex flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="animate-spin text-emerald-600" />
        <p className="text-sm font-semibold text-gray-500">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[5000] bg-gray-50 overflow-y-auto">
      {/* Top sticky navigation */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs z-10">
        <div className="max-w-2xl mx-auto px-4 h-15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">My Profile</h1>
              <p className="text-[11px] text-gray-500">Manage your avatar, contact info, and bio</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check size={14} className="text-white" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Error message banner */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Card & Avatar Upload */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 flex flex-col items-center text-center">
          <div className="relative mb-3 group">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-emerald-500/20 shadow-md bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-3xl font-extrabold relative">
              {form.avatar_url ? (
                <img
                  src={form.avatar_url}
                  alt={form.name || 'User avatar'}
                  className="w-full h-full object-cover"
                />
              ) : form.name ? (
                form.name.charAt(0).toUpperCase()
              ) : (
                user?.email?.charAt(0).toUpperCase() || 'P'
              )}

              {/* Uploading Overlay */}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[11px] font-bold">
                  <Loader2 size={22} className="animate-spin mb-1 text-emerald-400" />
                  <span>Uploading</span>
                </div>
              )}
            </div>

            {/* Camera action badge */}
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center shadow-md ring-2 ring-white transition-all cursor-pointer"
              title="Upload profile picture"
            >
              <Camera size={15} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileSelect}
            />
          </div>

          <h2 className="text-base font-bold text-gray-900">
            {form.name || 'Set your name'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            <Sparkles size={11} />
            <span>{form.userType}</span>
          </span>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User size={14} className="text-gray-400" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              placeholder="e.g. Ruwan Wickramasinghe"
              className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Phone size={14} className="text-gray-400" />
              <span>Contact Phone</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={handleChange('phone')}
              placeholder="0771234567 or +94771234567"
              className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Used when buyers contact you via WhatsApp or Direct Call.
            </p>
          </div>

          {/* Bio Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-gray-400" />
                <span>Seller Bio</span>
              </label>
              <span className="text-[10px] text-gray-400 font-medium">
                {form.bio.length}/300
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={300}
              value={form.bio}
              onChange={handleChange('bio')}
              placeholder="Tell buyers about yourself... e.g., 'Trusted car dealer in Kandy'"
              className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all resize-none leading-relaxed"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              This bio is shown to buyers on every listing you pin on the map.
            </p>
          </div>

          {/* User Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield size={14} className="text-gray-400" />
              <span>Account Type</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {USER_TYPES.map((type) => (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, userType: type.key }))}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    form.userType === type.key
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <p className="text-xs font-bold text-gray-900">{type.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Company / Agency (if Broker or Dealer) */}
          {(form.userType === 'broker' || form.userType === 'dealer') && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building size={14} className="text-gray-400" />
                <span>Agency or Business Name</span>
              </label>
              <input
                type="text"
                value={form.company}
                onChange={handleChange('company')}
                placeholder="e.g. Apex Premier Realty"
                className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          )}

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-gray-950 hover:bg-gray-800 active:scale-[0.99] disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-sm cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={16} className="text-emerald-400" />
                  <span>Profile Saved Successfully!</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Manage My Ads Card */}
        {onOpenMyListings && (
          <div className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50/60 rounded-3xl p-4 shadow-sm border border-amber-200/70 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <span>⭐</span>
                <span>My Ads & Golden Pins</span>
              </p>
              <p className="text-[11px] text-amber-800">
                Manage your listings & upgrade them to Golden Pins
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onBack();
                onOpenMyListings();
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 active:scale-95 px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span>Manage Ads</span>
            </button>
          </div>
        )}

        {/* Sign Out Card */}
        <div className="mt-6 bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-800">Account Session</p>
            <p className="text-[11px] text-gray-500">Sign out of your Sellinmap account</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
