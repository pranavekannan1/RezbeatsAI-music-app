import React, { useState } from 'react';
import { UserAuthProfile } from '../types';
import {
  isFirebaseConfigured,
  loginWithFirebase,
  signupWithFirebase,
  loginWithGoogle,
  resetPasswordWithFirebase,
} from '../services/firebase';

interface AuthScreenProps {
  onAuthSuccess: (user: UserAuthProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!isFirebaseConfigured) {
      setErrorMsg('Authentication is not configured. Add the VITE_FIREBASE_* values to your .env file.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    if (!isLogin && !name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      let user: UserAuthProfile;
      if (isLogin) {
        user = await loginWithFirebase(email.trim(), password);
      } else {
        user = await signupWithFirebase(email.trim(), password, name.trim());
      }
      onAuthSuccess(user);
    } catch (err: any) {
      const code = err?.code || '';
      let msg = err?.message || 'Authentication failed. Please try again.';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. Please check and retry.';
      } else if (code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please log in.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Invalid email address format.';
      } else if (code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      onAuthSuccess(user);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err?.message || 'Google Sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      await resetPasswordWithFirebase(forgotEmail.trim());
      setShowForgotModal(false);
      setInfoMsg(`Password reset instructions sent to ${forgotEmail}.`);
      setForgotEmail('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send reset link.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] text-[#f1f0f7] relative overflow-x-hidden selection:bg-[#7928ca] selection:text-white flex flex-col justify-center">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-[#7928ca]/20 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-[#dbb8ff]/15 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-900/10 rounded-full blur-[180px] pointer-events-none"></div>

      {/* Subtle Background Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* ================= LEFT COLUMN: Rich Visual Feature Showcase (Fills the desktop side) ================= */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-8 pr-4">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-md self-start shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dbb8ff] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7928ca]"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide bg-gradient-to-r from-white via-[#dbb8ff] to-[#aec6ff] bg-clip-text text-transparent uppercase">
                RezbeatsAI Neural Audio 2.0
              </span>
            </div>

            {/* Hero Title & Subtitle */}
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-black font-display tracking-tight text-white leading-[1.15]">
                Music that vibes with you,{' '}
                <span className="bg-gradient-to-r from-[#dbb8ff] via-[#9d4edd] to-[#aec6ff] bg-clip-text text-transparent">
                  track after track.
                </span>
              </h1>
              <p className="text-base text-[#cec2d6]/80 max-w-xl leading-relaxed">
                Enjoy ad-free continuous streaming powered by smart related-track queueing, lossless spatial acoustics, non-blocking player navigation, and real-time lyrics.
              </p>
            </div>

            {/* Interactive Dynamic Now-Playing Preview Card */}
            <div className="relative group p-5 rounded-3xl bg-gradient-to-br from-[#161722]/90 via-[#13141c]/90 to-[#1e172a]/80 border border-white/[0.1] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all hover:border-[#dbb8ff]/30">
              {/* Subtle card glow */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-[#7928ca]/20 via-[#dbb8ff]/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center gap-4">
                {/* Album Art with Neon Vinyl Rim */}
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-[#7928ca]/30 flex-shrink-0 bg-[#232433] flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#7928ca] to-[#3b82f6] opacity-80"></div>
                  <span className="material-symbols-outlined text-white text-3xl relative z-10">album</span>
                  <div className="absolute inset-0 ring-1 ring-white/20 rounded-2xl pointer-events-none"></div>
                </div>

                {/* Track Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#7928ca]/30 text-[#dbb8ff] border border-[#7928ca]/40">
                      Now Streaming
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Lossless 320kbps
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white truncate mt-1">Blinding Lights (AI Radio)</h4>
                  <p className="text-xs text-[#cec2d6]/70 truncate">The Weeknd • Auto-Queued from your taste</p>
                </div>

                {/* Equalizer animation */}
                <div className="flex items-end gap-1 h-6 px-2">
                  <span className="w-1 bg-[#dbb8ff] rounded-full animate-eq-1"></span>
                  <span className="w-1 bg-[#9d4edd] rounded-full animate-eq-2"></span>
                  <span className="w-1 bg-[#aec6ff] rounded-full animate-eq-3"></span>
                  <span className="w-1 bg-[#dbb8ff] rounded-full animate-eq-1"></span>
                </div>
              </div>

              {/* Progress bar mock */}
              <div className="mt-4 space-y-1.5">
                <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-[#7928ca] via-[#9d4edd] to-[#dbb8ff] rounded-full relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-sm"></div>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-[#cec2d6]/60 font-mono">
                  <span>2:18</span>
                  <span className="text-[#dbb8ff]">Next: Starboy (Related Artist)</span>
                  <span>3:20</span>
                </div>
              </div>
            </div>

            {/* Feature Highlight Pills */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all">
                <div className="w-8 h-8 rounded-xl bg-[#7928ca]/20 text-[#dbb8ff] flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-lg">queue_music</span>
                </div>
                <h5 className="text-xs font-bold text-white mb-0.5">Smart Next Tracks</h5>
                <p className="text-[11px] text-[#cec2d6]/70 leading-snug">Continuous playback based on artist, genre & mood.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all">
                <div className="w-8 h-8 rounded-xl bg-[#508eff]/20 text-[#aec6ff] flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-lg">dock_to_bottom</span>
                </div>
                <h5 className="text-xs font-bold text-white mb-0.5">Non-Blocking Nav</h5>
                <p className="text-[11px] text-[#cec2d6]/70 leading-snug">Browse tabs and search without closing the player.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-lg">equalizer</span>
                </div>
                <h5 className="text-xs font-bold text-white mb-0.5">Lossless Fidelity</h5>
                <p className="text-[11px] text-[#cec2d6]/70 leading-snug">Crystal clear audio stream with custom equalizer.</p>
              </div>
            </div>

            {/* Community & Audio Metric Strip */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs text-[#cec2d6]/70">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0a0a0f] bg-gradient-to-tr from-pink-500 to-rose-400"></div>
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0a0a0f] bg-gradient-to-tr from-purple-500 to-indigo-500"></div>
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0a0a0f] bg-gradient-to-tr from-blue-400 to-emerald-400"></div>
                </div>
                <span className="font-medium text-white/90">Joined by 100k+ music lovers</span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="material-symbols-outlined text-xs">verified</span> 100% Free
                </span>
                <span className="text-white/40">•</span>
                <span className="flex items-center gap-1 text-[#dbb8ff] font-semibold">
                  <span className="material-symbols-outlined text-xs">headphones</span> 50M+ Tracks
                </span>
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: The Auth Form Card ================= */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <div className="relative z-10 w-full max-w-md bg-[#13131a]/90 backdrop-blur-2xl border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.85)] flex flex-col space-y-6 animate-fade-in">
              
              {/* Brand Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7928ca] to-[#dbb8ff] shadow-lg shadow-[#7928ca]/30 mb-1">
                  <span className="material-symbols-outlined text-3xl text-white">graphic_eq</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display bg-gradient-to-r from-white via-[#f1f0f7] to-[#dbb8ff] bg-clip-text text-transparent">
                  RezbeatsAI Music
                </h1>
                <p className="text-xs sm:text-sm text-[#cec2d6]/70">
                  {isLogin ? 'Sign in to access your high-fidelity music realm' : 'Join RezbeatsAI for endless high-fidelity soundscapes'}
                </p>

                {/* Firebase Status Badge */}
                <div className="pt-1">
                  {isFirebaseConfigured ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      Authentication Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      <span className="material-symbols-outlined text-xs">info</span>
                      Authentication Not Configured
                    </span>
                  )}
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex p-1 bg-[#1c1d25] rounded-xl border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    isLogin
                      ? 'bg-gradient-to-r from-[#7928ca] to-[#9d4edd] text-white shadow-md'
                      : 'text-[#cec2d6]/70 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    !isLogin
                      ? 'bg-gradient-to-r from-[#7928ca] to-[#9d4edd] text-white shadow-md'
                      : 'text-[#cec2d6]/70 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Messages */}
              {errorMsg && (
                <div className="px-4 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {infoMsg && (
                <div className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base flex-shrink-0">check_circle</span>
                  <span>{infoMsg}</span>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#cec2d6]/80 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#dbb8ff]">person</span>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="User Name"
                      className="w-full bg-[#1b1c24] border border-white/[0.08] focus:border-[#dbb8ff]/60 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-[#8d8396] focus:outline-none transition-all"
                      required={!isLogin}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#cec2d6]/80 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#dbb8ff]">mail</span>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full bg-[#1b1c24] border border-white/[0.08] focus:border-[#dbb8ff]/60 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-[#8d8396] focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#cec2d6]/80 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#dbb8ff]">lock</span>
                      Password
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[11px] text-[#dbb8ff] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1b1c24] border border-white/[0.08] focus:border-[#dbb8ff]/60 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-[#8d8396] focus:outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#cec2d6]/60 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-base">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7928ca] via-[#9d4edd] to-[#dbb8ff] text-white font-bold text-sm shadow-lg shadow-[#7928ca]/30 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">
                        {isLogin ? 'login' : 'how_to_reg'}
                      </span>
                      <span>{isLogin ? 'Sign In to RezbeatsAI' : 'Create My Account'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/[0.08]"></div>
                <span className="text-[11px] uppercase tracking-wider text-[#cec2d6]/50">Or continue with</span>
                <div className="flex-1 h-px bg-white/[0.08]"></div>
              </div>

              {/* Social / Alternative Buttons */}
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="py-2.5 px-3 rounded-xl bg-[#1b1c24] hover:bg-[#23242e] border border-white/[0.08] text-xs font-semibold text-[#f1f0f7] transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-white/20 active:scale-95 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>

              {/* Footer info note */}
              <p className="text-[11px] text-[#cec2d6]/50 text-center leading-relaxed">
                By continuing, you agree to enjoy ad-free lossless music streaming and personalized AI playlist recommendations.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#181922] border border-white/[0.12] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#dbb8ff]">lock_reset</span>
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-[#cec2d6]/60 hover:text-white p-1"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <p className="text-xs text-[#cec2d6]/70 leading-relaxed">
              Enter the email associated with your account and we will send a password reset link.
            </p>
            <form onSubmit={handleSendReset} className="space-y-3">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full bg-[#111218] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#dbb8ff]"
                required
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#7928ca] hover:bg-[#9d4edd] text-white text-xs font-bold transition-all cursor-pointer"
              >
                Send Reset Link
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

