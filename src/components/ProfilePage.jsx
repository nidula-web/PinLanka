import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { getProfile, saveProfile, signOut } from '../lib/auth';

const USER_TYPES = ['owner', 'broker', 'dealer'];

export default function ProfilePage({ user, onBack, onSignOut }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    userType: 'owner',
    company: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfile(user.uid).then((profile) => {
      if (profile) {
        setForm({
          name: profile.name || '',
          phone: profile.phone || '',
          userType: profile.userType || 'owner',
          company: profile.company || '',
        });
      }
      setLoading(false);
    });
  }, [user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await saveProfile(user.uid, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed to save profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[5000] bg-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[5000] bg-gray-50 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-100 shadow-sm z-10">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Avatar placeholder */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
            {form.name ? form.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </div>
          <p className="text-sm text-gray-500 mt-2">{user?.email}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="Your full name"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="94771234567"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* User Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">I am a</label>
            <div className="flex gap-2">
              {USER_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, userType: t }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${
                    form.userType === t
                      ? t === 'owner'
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.company}
              onChange={set('company')}
              placeholder="Your agency or company name"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Save */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white'
            }`}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : saved ? (
              '✓ Saved'
            ) : (
              <>
                <Save size={16} />
                Save Profile
              </>
            )}
          </button>
        </form>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full mt-4 py-3 text-red-600 font-semibold text-sm rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
