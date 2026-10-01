import React, { useState } from 'react';
import { AppUser, SYSTEM_USERS, REMOVED_USERNAMES } from '../types/auth';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Layers,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  AlertCircle,
} from 'lucide-react';

interface LoginViewProps {
  users: AppUser[];
  onLoginSuccess?: (user: AppUser) => void;
  onLogin?: (user: AppUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  onLoginSuccess,
  onLogin,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removedSet = new Set(REMOVED_USERNAMES.map((u) => u.toLowerCase()));
  const effectiveUsers = (users.length > 0 ? users : SYSTEM_USERS).filter(
    (u) => !removedSet.has(u.username.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('Please enter both your Username and Password.');
      return;
    }

    if (removedSet.has(cleanUsername)) {
      setError('This user account has been removed from the system.');
      return;
    }

    const foundUser = effectiveUsers.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.password === cleanPassword
    );

    if (!foundUser) {
      setError('Invalid username or password. Please enter your assigned password.');
      return;
    }

    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess(foundUser);
    } else if (typeof onLogin === 'function') {
      onLogin(foundUser);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:p-6 relative overflow-hidden">
      {/* Subtle Ambient Background */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg tracking-tight text-white truncate">
                GA Sample Tracking Master
              </h1>
              <p className="text-xs text-slate-400 truncate">
                Role-Based Sample &amp; Fabric Inventory Portal
              </p>
            </div>
          </div>
          <PWAInstallButton compact />
        </div>

        {/* Section Title */}
        <div className="mb-5">
          <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Password Sign In</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Enter your assigned department username and password to access your station.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3.5 rounded-xl bg-rose-950/75 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-username"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-username"
                type="text"
                required
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g. zahid, nishi, arian)"
                className="w-full min-h-[46px] bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full min-h-[46px] bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-12 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Sign In with Password</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Role Scope Information (No Instant Login / No Exposed Passwords) */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-2.5 text-xs text-slate-400">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Department Access Control</span>
          </div>
          <div className="space-y-2 text-[11px] leading-relaxed">
            <div>
              <strong className="text-indigo-300">Merchandiser / General User</strong>
              <span className="text-slate-500 mx-1.5">·</span>
              <span className="font-mono text-slate-300">zahid, animesh, rakib, hasan, nishi</span>
              <p className="text-slate-400 mt-0.5">
                Full access to sample requisitions, workflow stages, approvals, and fabric inventory.
              </p>
            </div>
            <div>
              <strong className="text-cyan-300">Wash</strong>
              <span className="text-slate-500 mx-1.5">·</span>
              <span className="font-mono text-slate-300">arian</span>
              <p className="text-slate-400 mt-0.5">
                Views Sewing &amp; Wash status samples only. Advances Sewing to Wash and Wash to Finishing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
