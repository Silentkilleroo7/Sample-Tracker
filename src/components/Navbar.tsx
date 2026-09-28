import React from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  AlertTriangle, 
  Layers, 
  Download,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { PushNotification } from '../types/notification';
import { AppUser, ROLE_BADGE_CONFIG, canUserMakeAllChanges, canUserAccessFabricInventory } from '../types/auth';

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
  const unreadCount = notifications.filter((n) => !n.read).length;
  const isMerchandiser = canUserMakeAllChanges(currentUser.role);
  const canViewFabric = canUserAccessFabricInventory(currentUser.role);
  const roleBadge = ROLE_BADGE_CONFIG[currentUser.role];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white font-mono">
                GA <span className="text-indigo-400">Sample Tracking Master</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO 4.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Apparel Sample Tracking & Fabric Inventory Pipeline
            </p>
          </div>
        </div>

        {/* Global Search Box (keyword, style, PO, line code) */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by Keyword, Style, PO #, Line Code, Buyer..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Actions & Alerts */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Low Fabric Warning Pill if count > 0 and user can view fabric */}
          {lowStockCount > 0 && canViewFabric && (
            <button
              onClick={onNavigateToLowStock}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/25 transition-all animate-pulse cursor-pointer"
              title="Click to view fabric inventory below 5 yds threshold"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="hidden xl:inline">Fabric Alert:</span>
              <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono text-[11px]">
                {lowStockCount} Critical
              </span>
            </button>
          )}

          {/* Export Action (Merchandiser Only) */}
          {isMerchandiser && (
            <button
              onClick={onExportData}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors hidden md:flex items-center gap-1 text-xs border border-slate-800 cursor-pointer"
              title="Export Samples & Fabric Data to JSON"
            >
              <Download className="w-4 h-4" />
              <span className="hidden xl:inline">Export</span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 cursor-pointer"
            title="Push Notifications & Alert Logs"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* New Requisition Button (Merchandiser Only) */}
          {isMerchandiser && (
            <button
              onClick={onNewRequisition}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">New Requisition</span>
              <span className="sm:hidden">New</span>
            </button>
          )}

          {/* Logged-In User Profile & Switch/Logout */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
            <div
              className={`px-2.5 py-1 rounded-xl border text-[11px] flex items-center gap-1.5 ${roleBadge.badgeClass}`}
              title={currentUser.permissionsSummary}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <div className="leading-tight">
                <span className="font-black text-white block sm:inline">
                  {currentUser.displayName}
                </span>
                <span className="hidden lg:inline ml-1 text-[10px] opacity-90 font-mono">
                  ({roleBadge.shortLabel})
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="Switch User / Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Switch User</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
