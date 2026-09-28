import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Waves,
  Sparkles,
  PackageCheck,
  ScrollText,
  AlertOctagon,
  FlaskConical,
} from 'lucide-react';
import { AppView } from './Sidebar';
import { UserRole } from '../types/auth';

interface MainModulesBottomProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  userRole?: UserRole;
  counts: {
    total: number;
    requisition?: number;
    sewing: number;
    wash: number;
    finishing: number;
    readyForParcel: number;
    approvals: number;
    lowFabric: number;
    testCount?: number;
    testOverdue?: number;
  };
}

export const MainModulesBottom: React.FC<MainModulesBottomProps> = ({
  currentView,
  onSelectView,
  userRole = 'merchandiser',
  counts,
}) => {
  const allModules = [
    {
      id: 'dashboard' as AppView,
      label: 'Dashboard',
      mobileLabel: 'Dashboard',
      subtitle: 'Summary & KPIs',
      icon: LayoutDashboard,
      badge: counts.lowFabric > 0 ? `${counts.lowFabric} Alert` : undefined,
      badgeVariant: counts.lowFabric > 0 ? 'critical' : 'neutral',
      color: 'text-indigo-400',
      allowedRoles: ['merchandiser'] as UserRole[],
    },
    {
      id: 'all_samples' as AppView,
      label:
        userRole === 'sewing'
          ? 'Requisition Samples'
          : userRole === 'wash'
          ? 'Sewing Status Samples'
          : 'Samples',
      mobileLabel:
        userRole === 'sewing'
          ? 'Requisitions'
          : userRole === 'wash'
          ? 'Sewing Samples'
          : 'Samples',
      subtitle:
        userRole === 'sewing'
          ? 'Move Req → Sewing Only'
          : userRole === 'wash'
          ? 'Move Sewing → Wash → Finishing'
          : 'Pipeline & Requisition',
      icon: Layers,
      count:
        userRole === 'sewing'
          ? counts.requisition ?? counts.total
          : userRole === 'wash'
          ? counts.sewing + counts.wash
          : counts.total,
      color: 'text-purple-400',
      allowedRoles: ['merchandiser', 'sewing', 'wash'] as UserRole[],
    },
    {
      id: 'wash' as AppView,
      label: 'Wash',
      mobileLabel: 'Wash Dept',
      subtitle:
        userRole === 'wash' ? 'Move Sewing → Wash → Finishing' : 'Wet Wash Status',
      icon: Waves,
      count: userRole === 'wash' ? counts.sewing + counts.wash : counts.wash,
      color: 'text-cyan-400',
      allowedRoles: ['merchandiser', 'wash'] as UserRole[],
    },
    {
      id: 'finishing' as AppView,
      label: 'Finishing',
      mobileLabel: 'Finishing',
      subtitle: 'Ironing & QA',
      icon: Sparkles,
      count: counts.finishing,
      color: 'text-amber-400',
      allowedRoles: ['merchandiser'] as UserRole[],
    },
    {
      id: 'approvals' as AppView,
      label: 'Parcel & Approval',
      mobileLabel: 'Approvals',
      subtitle: 'Courier & Comments',
      icon: PackageCheck,
      count: counts.readyForParcel + counts.approvals,
      color: 'text-emerald-400',
      allowedRoles: ['merchandiser'] as UserRole[],
    },
    {
      id: 'test' as AppView,
      label: 'Test',
      mobileLabel: 'BV Test',
      subtitle: 'BV Testing & 24h Re-Test',
      icon: FlaskConical,
      badge:
        counts.testOverdue && counts.testOverdue > 0
          ? `${counts.testOverdue} 24h!`
          : undefined,
      badgeVariant:
        counts.testOverdue && counts.testOverdue > 0 ? 'critical' : 'neutral',
      count: counts.testCount,
      color:
        counts.testOverdue && counts.testOverdue > 0
          ? 'text-rose-400'
          : 'text-blue-400',
      allowedRoles: ['merchandiser'] as UserRole[],
    },
    {
      id: 'fabric_inventory' as AppView,
      label: userRole === 'sewing' ? 'Fabric (View Mode)' : 'Fabric',
      mobileLabel: userRole === 'sewing' ? 'Fabric (View)' : 'Fabric',
      subtitle:
        userRole === 'sewing' ? 'View Only • No Access' : 'Stock & Yardage',
      icon: ScrollText,
      badge: counts.lowFabric > 0 ? `${counts.lowFabric} Low` : undefined,
      badgeVariant: counts.lowFabric > 0 ? 'critical' : 'neutral',
      color: counts.lowFabric > 0 ? 'text-rose-400' : 'text-slate-300',
      allowedRoles: ['merchandiser', 'sewing'] as UserRole[],
    },
  ];

  const modules = allModules.filter((m) => m.allowedRoles.includes(userRole));
  const isCompactRole = modules.length <= 3;

  return (
    <nav
      aria-label="Main modules navigation"
      className="sticky bottom-0 z-40 w-full bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2">
        {/* Desktop-only Status Header (hidden on mobile to preserve 85%+ viewport space) */}
        <div className="hidden sm:flex items-center justify-between px-2 mb-1.5 text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-indigo-300">
              Main Tracking Modules
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="text-slate-400">
              In Pipeline: <strong className="text-white">{counts.total}</strong> styles
            </span>
            {counts.lowFabric > 0 && (
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <AlertOctagon className="w-3 h-3" />
                {counts.lowFabric} Fabric Alert
              </span>
            )}
          </div>
        </div>

        {/* Single-Row Mobile Thumb Dock & Responsive Desktop Grid */}
        <div
          className={
            isCompactRole
              ? 'grid grid-cols-2 sm:grid-cols-2 gap-1.5'
              : 'flex overflow-x-auto no-scrollbar gap-1.5 sm:grid sm:grid-cols-7'
          }
        >
          {modules.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`relative min-h-[48px] ${
                  isCompactRole ? 'w-full' : 'min-w-[78px] sm:min-w-0 shrink-0'
                } flex flex-col sm:flex-row items-center justify-center sm:justify-between px-2.5 py-1.5 sm:py-2 rounded-xl transition-all group cursor-pointer text-left ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800/80'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-300 rounded-full" />
                )}

                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 min-w-0">
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                  </div>
                  <div className="hidden lg:block truncate min-w-0">
                    <div className="font-semibold text-xs truncate leading-tight">
                      {item.label}
                    </div>
                    <div
                      className={`text-[9px] truncate ${
                        isActive ? 'text-indigo-200' : 'text-slate-500'
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                  <span className="lg:hidden text-[10px] sm:text-[11px] font-semibold truncate whitespace-nowrap">
                    {item.mobileLabel}
                  </span>
                </div>

                {/* Count / Badge Indicator */}
                <div className="hidden sm:flex items-center ml-1 shrink-0">
                  {item.badge ? (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ${
                        item.badgeVariant === 'critical'
                          ? isActive
                            ? 'bg-rose-500 text-white'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : item.count !== undefined ? (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold tabular-nums ${
                        isActive
                          ? 'bg-indigo-800 text-white'
                          : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {item.count}
                    </span>
                  ) : null}
                </div>

                {/* Compact Mobile Count Dot */}
                {item.count !== undefined && (
                  <span
                    className={`sm:hidden absolute top-1 right-1.5 text-[9px] font-mono font-bold tabular-nums px-1 rounded ${
                      isActive
                        ? 'bg-indigo-800/90 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
