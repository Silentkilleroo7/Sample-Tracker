import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Printer,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { PushNotification } from '../types/notification';
import {
  AppUser,
  ROLE_BADGE_CONFIG,
  canUserMakeAllChanges,
  canUserAccessFabricInventory,
} from '../types/auth';
import {
  SampleItem,
  STAGE_CONFIG,
  rankSamplesBySearchQuery,
} from '../types/sample';

interface NavbarProps {
  currentUser: AppUser;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  samples?: SampleItem[];
  onSelectSample?: (sample: SampleItem) => void;
  onOpenRequisitionSlip?: (sample: SampleItem) => void;
  onNavigateToSamples?: () => void;
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
  samples = [],
  onSelectSample,
  onOpenRequisitionSlip,
  onNavigateToSamples,
  notifications,
  onOpenNotifications,
  onNewRequisition,
  lowStockCount,
  onNavigateToLowStock,
  onExportData,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isMerchandiser = canUserMakeAllChanges(currentUser.role);
  const canViewFabric = canUserAccessFabricInventory(currentUser.role);
  const roleBadge = ROLE_BADGE_CONFIG[currentUser.role];

  const showMobileSearchRow = mobileSearchOpen || Boolean(searchQuery.trim());

  // Instant Auto-Detect & Closeness Ranking Search Results
  const rankedMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return rankSamplesBySearchQuery(samples, searchQuery);
  }, [samples, searchQuery]);

  const topAutoDetected = rankedMatches.length > 0 ? rankedMatches[0] : null;
  const relatedMatches = rankedMatches.slice(1, 7);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderStatusTag = (sample: SampleItem) => {
    if (sample.priority === 'urgent') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase">
          Urgent
        </span>
      );
    }
    if (sample.approvalDetails?.overallVerdict === 'approved') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white uppercase">
          Approved
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase">
        Pending
      </span>
    );
  };

  const renderSearchDropdown = () => {
    if (!isSearchDropdownOpen || !searchQuery.trim()) return null;

    return (
      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-emerald-500 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[75vh] overflow-y-auto">
        {rankedMatches.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-600">
            No style or PO number matched <strong>&ldquo;{searchQuery}&rdquo;</strong>. Try typing a partial PO # or Style Name.
          </div>
        ) : (
          <div className="divide-y divide-emerald-100">
            {/* 1. AUTO-DETECTED BEST MATCH STYLE */}
            {topAutoDetected && (
              <div className="p-3 bg-emerald-50/70">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Auto-Detected Style • {topAutoDetected.matchReason}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700">
                    {topAutoDetected.score}% Match
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-emerald-300 shadow-xs">
                  <div
                    onClick={() => {
                      if (onSelectSample) onSelectSample(topAutoDetected.sample);
                      setIsSearchDropdownOpen(false);
                    }}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-sm text-emerald-950">
                        {topAutoDetected.sample.styleCode}
                      </span>
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {topAutoDetected.sample.styleName}
                      </span>
                      {renderStatusTag(topAutoDetected.sample)}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-0.5 flex-wrap">
                      <span>
                        PO: <strong className="text-slate-900">{topAutoDetected.sample.poNumber || 'N/A'}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Buyer: <strong className="text-slate-900">{topAutoDetected.sample.buyer}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Stage: <strong className="text-emerald-800">{STAGE_CONFIG[topAutoDetected.sample.stage]?.label}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onOpenRequisitionSlip && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRequisitionSlip(topAutoDetected.sample);
                          setIsSearchDropdownOpen(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Print Requisition Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectSample) onSelectSample(topAutoDetected.sample);
                        setIsSearchDropdownOpen(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      Open
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. RELATED / CLOSEST MATCHING STYLES */}
            {relatedMatches.length > 0 && (
              <div className="p-2.5 bg-white">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1.5 mb-1.5">
                  Related &amp; Closest Matching Styles ({relatedMatches.length})
                </div>
                <div className="space-y-1">
                  {relatedMatches.map((item) => (
                    <div
                      key={item.sample.id}
                      onClick={() => {
                        if (onSelectSample) onSelectSample(item.sample);
                        setIsSearchDropdownOpen(false);
                      }}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50/80 transition-colors cursor-pointer border border-transparent hover:border-emerald-200"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-emerald-950">
                            {item.sample.styleCode}
                          </span>
                          <span className="font-semibold text-xs text-slate-800 truncate">
                            {item.sample.styleName}
                          </span>
                          {renderStatusTag(item.sample)}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <span>PO: {item.sample.poNumber}</span>
                          <span>·</span>
                          <span>{item.sample.buyer}</span>
                          <span>·</span>
                          <span className="text-emerald-700 font-medium">{item.matchReason}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-emerald-700 shrink-0">
                        {item.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. VIEW ALL RESULTS IN PIPELINE */}
            <div className="px-3 py-2 bg-emerald-50/50 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-600">
                Found <strong>{rankedMatches.length}</strong> related style(s)
              </span>
              {onNavigateToSamples && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToSamples();
                    setIsSearchDropdownOpen(false);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                >
                  Show All Matching Styles
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="w-full bg-white border-b border-emerald-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-xs shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm sm:text-base lg:text-lg tracking-tight text-slate-900 truncate">
            <span className="sm:hidden">GA Sample Master</span>
            <span className="hidden sm:inline">GA Sample Tracking Master</span>
          </span>
        </div>

        {/* Zone 2: Desktop Global Search Box with Instant Auto-Detect */}
        <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-lg mx-2 relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-700">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchDropdownOpen(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsSearchDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  if (onNavigateToSamples) onNavigateToSamples();
                  setIsSearchDropdownOpen(false);
                }
              }}
              placeholder="Instant Search by PO #, Style Name, Style Code, Buyer..."
              className="w-full pl-9 pr-16 py-2 text-xs sm:text-sm bg-white border border-emerald-300 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setIsSearchDropdownOpen(false);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-950 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {renderSearchDropdown()}
        </div>

        {/* Zone 3: Actions & User Account */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            className={`md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
              showMobileSearchRow
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50'
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
              className="min-h-[40px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-all cursor-pointer whitespace-nowrap"
              title="View fabric inventory below 5 yds threshold"
            >
              <AlertTriangle className="w-4 h-4 text-white shrink-0" />
              <span className="hidden xl:inline">Fabric Alert:</span>
              <span className="font-mono text-[11px] font-bold text-white">
                {lowStockCount}
              </span>
            </button>
          )}

          {/* Export Action (Merchandiser Only on Desktop) */}
          {isMerchandiser && (
            <button
              type="button"
              onClick={onExportData}
              className="min-h-[40px] px-2.5 py-1.5 text-emerald-900 hover:bg-emerald-50 rounded-xl transition-colors hidden lg:flex items-center gap-1.5 text-xs border border-emerald-200 cursor-pointer whitespace-nowrap"
              title="Export Samples & Fabric Data to JSON"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span className="hidden xl:inline">Export</span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative min-h-[40px] min-w-[40px] flex items-center justify-center text-emerald-900 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-200 cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* New Requisition Button (Merchandiser Only) */}
          {isMerchandiser && (
            <button
              type="button"
              onClick={onNewRequisition}
              className="min-h-[40px] flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span className="hidden sm:inline">New Requisition</span>
              <span className="sm:hidden">New</span>
            </button>
          )}

          {/* Logged-In User Identity & Sign Out */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-emerald-200">
            <div
              className={`min-h-[40px] px-2 sm:px-2.5 py-1 rounded-xl border text-[11px] flex items-center gap-1.5 whitespace-nowrap ${roleBadge.badgeClass}`}
              title={`${currentUser.displayName} (${roleBadge.label})`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
              <span className="font-semibold text-emerald-950 max-w-[72px] sm:max-w-none truncate">
                {currentUser.displayName}
              </span>
              <span className="hidden lg:inline text-[10px] opacity-90 font-mono text-emerald-800">
                · {roleBadge.shortLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[40px] min-w-[40px] px-2 sm:px-2.5 py-1.5 rounded-xl bg-white hover:bg-red-600 text-slate-700 hover:text-white border border-emerald-200 hover:border-red-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
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
        <div className="md:hidden px-3 pb-2.5 pt-1 border-t border-emerald-100 bg-white relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-emerald-700 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchDropdownOpen(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsSearchDropdownOpen(true);
              }}
              placeholder="Search PO #, Style Name, Style Code, Buyer..."
              className="w-full min-h-[42px] pl-10 pr-16 py-2 text-xs bg-white border border-emerald-300 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setIsSearchDropdownOpen(false);
                }}
                className="absolute right-2.5 px-2 py-1 rounded-lg bg-emerald-50 text-[11px] font-semibold text-emerald-800 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          {renderSearchDropdown()}
        </div>
      )}
    </header>
  );
};
