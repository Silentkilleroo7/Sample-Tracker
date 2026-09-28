import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  AlertTriangle,
  Layers,
  Download,
  LogOut,
  UserCheck,
  X,
} from 'lucide-react';
import { PushNotification } from '../types/notification';
import {
  AppUser,
  ROLE_BADGE_CONFIG,
  canUserMakeAllChanges,
  canUserAccessFabricInventory,
} from '../types/auth';

interface NavbarProps {
  currentUser: AppUser;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  notifications: PushNotification[];
  onOpenNotifications: () => void;
  onNewRequisition: () => void;
  lowStockCount: number;
  onNavigateToLowStock: () => void;
  onExportData: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  searchQuery,
  onSearchChange,
  notifications,
  onOpenNotifications,
  onNewRequisition,
  lowStockCount,
  onNavigateToLowStock,
  onExportData,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isMerchandiser = canUserMakeAllChanges(currentUser.role);
  const canViewFabric = canUserAccessFabricInventory(currentUser.role);
  const roleBadge = ROLE_BADGE_CONFIG[currentUser.role];

  const showMobileSearchRow = mobileSearchOpen || Boolean(searchQuery.trim());

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm sm:text-base lg:text-lg tracking-tight text-white truncate">
            <span className="sm:hidden">GA Sample Master</span>
            <span className="hidden sm:inline">GA Sample Tracking Master</span>
          </span>
        </div>

        {/* Zone 2: Desktop Global Search Box */}
        <div className="hidden md:block flex-1 max-w-md mx-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by Style, PO #, Line Code, Buyer..."
              className="w-full pl-9 pr-14 py-2 text-xs sm:text-sm bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Zone 3: Actions & User Account */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            className={`md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
              showMobileSearchRow
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle Search"
            aria-label="Toggle Search"
          >
            {showMobileSearchRow ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Low Fabric Warning Action */}
          {lowStockCount > 0 && canViewFabric && (
            <button
              type="button"
              onClick={onNavigateToLowStock}
              className="min-h-[40px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/25 transition-all cursor-pointer whitespace-nowrap"
              title="View fabric inventory below 5 yds threshold"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="hidden xl:inline">Fabric Alert:</span>
              <span className="font-mono text-[11px] font-bold text-rose-200">
                {lowStockCount}
              </span>
            </button>
          )}

          {/* Export Action (Merchandiser Only on Desktop) */}
          {isMerchandiser && (
            <button
              type="button"
              onClick={onExportData}
              className="min-h-[40px] px-2.5 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors hidden lg:flex items-center gap-1.5 text-xs border border-slate-800 cursor-pointer whitespace-nowrap"
              title="Export Samples & Fabric Data to JSON"
            >
              <Download className="w-4 h-4" />
              <span className="hidden xl:inline">Export</span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-800 cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* New Requisition Button (Merchandiser Only) */}
          {isMerchandiser && (
            <button
              type="button"
              onClick={onNewRequisition}
              className="min-h-[40px] flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/25 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span className="hidden sm:inline">New Requisition</span>
              <span className="sm:hidden">New</span>
            </button>
          )}

          {/* Logged-In User Identity & Sign Out */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
            <div
              className={`min-h-[40px] px-2 sm:px-2.5 py-1 rounded-xl border text-[11px] flex items-center gap-1.5 whitespace-nowrap ${roleBadge.badgeClass}`}
              title={`${currentUser.displayName} (${roleBadge.label})`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold text-white max-w-[72px] sm:max-w-none truncate">
                {currentUser.displayName}
              </span>
              <span className="hidden lg:inline text-[10px] opacity-90 font-mono">
                · {roleBadge.shortLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[40px] min-w-[40px] px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {showMobileSearchRow && (
        <div className="md:hidden px-3 pb-2.5 pt-1 border-t border-slate-800/80 bg-slate-900/95">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Style, PO #, Line Code, Buyer..."
              className="w-full min-h-[42px] pl-10 pr-16 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 px-2 py-1 rounded-lg bg-slate-700 text-[11px] font-semibold text-slate-200 hover:text-white cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
