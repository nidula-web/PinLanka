import { useState } from 'react';
import { X, Mail, Lock, User, Phone, Loader2, AlertCircle } from 'lucide-react';
import { signUp, signIn, createUserProfile, validateSriLankanPhone } from '../lib/auth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function AuthModal({ open, onClose, onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }

      // Mandatory Sri Lankan phone number validation
      const phoneValidation = validateSriLankanPhone(phone);
      if (!phoneValidation.valid) {
        setError('Please enter a valid mobile number.');
        return;
      }

      const fullName = name.trim();
      const phoneNumber = phoneValidation.formatted;

      setLoading(true);
      try {
        if (isSupabaseConfigured && supabase) {
          // 1. Sign up the user and save their metadata:
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

          // 2. If successful, IMMEDIATELY insert their data into the public `profiles` table:
          if (authData.user) {
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

            const userObj = authData.user;
            userObj.uid = authData.user.id;
            onAuth(userObj);
          }
        } else {
          // Local fallback mode
          const user = await signUp(email, password, { fullName, phoneNumber });
          await createUserProfile(user.uid || user.id, {
            email: user.email,
            name: fullName,
            phone: phoneNumber,
            userType: 'owner',
          });
          onAuth(user);
        }

        onClose();
      } catch (err) {
        const msg = err.code?.replace('auth/', '').replace(/-/g, ' ') || err.message;
        setError(msg.charAt(0).toUpperCase() + msg.slice(1));
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const user = await signIn(email, password);
        onAuth(user);
        onClose();
      } catch (err) {
        const msg = err.code?.replace('auth/', '').replace(/-/g, ' ') || err.message;
        setError(msg.charAt(0).toUpperCase() + msg.slice(1));
      } finally {
        setLoading(false);
      }
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[4000]" onClick={onClose} />

      <div className="fixed inset-x-0 top-0 bottom-0 z-[4001] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                {mode === 'login' ? 'Welcome back' : 'Create an Account'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                {mode === 'login'
                  ? 'Sign in to access your Selinmap listings'
                  : 'Join Selinmap to list items & manage ads'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3.5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Signup specific: Full Name */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Nimal Perera"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Signup specific: Mandatory Mobile Number */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 077 123 4567 or +94771234567"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Sri Lankan mobile format (e.g. 07XXXXXXXX or +947XXXXXXXX)
                </p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gray-950 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 mt-2 shadow-sm active:scale-[0.99]"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            {/* Switch Mode */}
            <p className="text-center text-xs text-gray-500 pt-2">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                className="text-blue-600 font-bold hover:underline"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
