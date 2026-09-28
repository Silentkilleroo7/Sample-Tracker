import React, { useState } from 'react';
import { AppUser, SYSTEM_USERS, UserRole, ROLE_BADGE_CONFIG } from '../types/auth';
import {
  Layers,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Scissors,
  Waves,
  Briefcase,
  ArrowRight,
  KeyRound,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface LoginViewProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLoginSuccess }) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole | 'all'>('all');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentialsDirectory, setShowCredentialsDirectory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveUsers = users.length > 0 ? users : SYSTEM_USERS;

  const filteredDirectoryUsers = effectiveUsers.filter((u) =>
    selectedRoleTab === 'all' ? true : u.role === selectedRoleTab
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('Please enter both Username and Password.');
      return;
    }

    const foundUser = effectiveUsers.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.password === cleanPassword
    );

    if (!foundUser) {
      setError('Invalid username or password. Please check the user credentials directory below.');
      return;
    }

    onLoginSuccess(foundUser);
  };

  const handleQuickFill = (u: AppUser) => {
    setUsername(u.username);
    setPassword(u.password);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
        {/* LEFT COLUMN: LOGIN FORM */}
        <div className="lg:col-span-5 bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-800">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 shrink-0">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg tracking-tight text-white font-mono">
                    GA <span className="text-indigo-400">Sample Master</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    PRO 4.0
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Role-Based Sample &amp; Fabric Inventory Access Portal
                </p>
              </div>
            </div>

            <h1 className="text-xl font-black text-white mb-1 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              <span>Sign In to Your Station</span>
            </h1>
            <p className="text-xs text-slate-400 mb-5">
              Authenticate as <strong className="text-indigo-300">Merchandiser</strong>,{' '}
              <strong className="text-purple-300">Sewing</strong>, or{' '}
              <strong className="text-cyan-300">Wash</strong> operator.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. zahid, animesh, rakib, hasan, sohag, arian"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  User Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter user password..."
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
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
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Sign In to System</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Role Access Matrix Summary */}
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Role-Based Access Control (RBAC) Enforced:</span>
            </div>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-start gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1 shrink-0" />
                <span>
                  <strong className="text-indigo-300">Merchandiser:</strong> General user with full access to all sample stages, requisitions &amp; fabric inventory.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 mt-1 shrink-0" />
                <span>
                  <strong className="text-purple-300">Sewing:</strong> Sees Requisition status samples only + Fabric Inventory (View-Only Mode). Moves Requisition → Sewing Status only.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0" />
                <span>
                  <strong className="text-cyan-300">Wash:</strong> Sees Sewing Status (&amp; active Wash) samples only. Moves Sewing → Wash and Wash → Finishing only.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: GENERATED USERS & CREDENTIALS DIRECTORY */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Supabase Connected Accounts
                </span>
                <h2 className="text-lg font-black text-white mt-1">
                  Authorized Department Users (6 Accounts)
                </h2>
                <p className="text-xs text-slate-400">
                  Click any user card below to auto-fill credentials or sign in directly to test role permissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCredentialsDirectory(!showCredentialsDirectory)}
                className="text-xs font-bold text-indigo-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer"
              >
                {showCredentialsDirectory ? 'Hide Passwords' : 'Show Passwords'}
              </button>
            </div>

            {/* Role Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              <button
                type="button"
                onClick={() => setSelectedRoleTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRoleTab === 'all'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                All Users (6)
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoleTab('merchandiser')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedRoleTab === 'merchandiser'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/30'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Merchandiser (4)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoleTab('sewing')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedRoleTab === 'sewing'
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-slate-800 text-purple-300 hover:text-white border border-purple-500/30'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Sewing (1)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoleTab('wash')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedRoleTab === 'wash'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/30'
                }`}
              >
                <Waves className="w-3.5 h-3.5" />
                <span>Wash (1)</span>
              </button>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredDirectoryUsers.map((u) => {
                const roleCfg = ROLE_BADGE_CONFIG[u.role];
                const isSelected = username.toLowerCase() === u.username.toLowerCase();

                return (
                  <div
                    key={u.username}
                    onClick={() => handleQuickFill(u)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-400 ring-2 ring-indigo-500/30 shadow-lg'
                        : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-black text-sm text-white uppercase">
                            {u.displayName.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-black text-white text-sm leading-tight">
                              {u.displayName}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">
                              @{u.username}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleCfg.badgeClass}`}
                        >
                          {roleCfg.shortLabel}
                        </span>
                      </div>

                      <div className="mt-2.5 p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between font-mono text-[11px]">
                        <span className="text-slate-400">
                          User: <strong className="text-white">{u.username}</strong>
                        </span>
                        <span className="text-slate-400">
                          Pass:{' '}
                          <strong className="text-amber-300">
                            {showCredentialsDirectory ? u.password : '••••••••'}
                          </strong>
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                        {u.permissionsSummary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                      <span className="text-[10px] text-indigo-300 font-semibold flex items-center gap-1">
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Filled in form</span>
                          </>
                        ) : (
                          'Click to fill credentials'
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLoginSuccess(u);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shadow transition-colors cursor-pointer"
                      >
                        <span>Instant Login</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              Merchandisers: <strong className="text-white font-mono">zahid, animesh, rakib, hasan</strong>
            </span>
            <span>
              Sewing: <strong className="text-purple-300 font-mono">sohag</strong> • Wash:{' '}
              <strong className="text-cyan-300 font-mono">arian</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
