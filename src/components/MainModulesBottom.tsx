import React from 'react';
import {
  LayoutDashboard,
  Scissors,
  Waves,
  Sparkles,
  PackageCheck,
  MessageSquare,
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
      label: 'Dashboard (Requisition)',
      mobileLabel: 'Requisition',
      subtitle: 'Requisition Status Only',
      icon: LayoutDashboard,
      count: counts.requisition ?? 0,
      badge: counts.lowFabric > 0 ? `${counts.lowFabric} Alert` : undefined,
      badgeVariant: counts.lowFabric > 0 ? 'critical' : 'neutral',
      color: 'text-emerald-700',
      allowedRoles: ['merchandiser', 'sewing'] as UserRole[],
    },
    {
      id: 'all_samples' as AppView,
      label: 'Sewing',
      mobileLabel: 'Sewing',
      subtitle: 'Sewing Status Only',
      icon: Scissors,
      count: counts.sewing,
      color: 'text-emerald-700',
      allowedRoles: ['merchandiser', 'sewing', 'wash'] as UserRole[],
    },
    {
      id: 'wash' as AppView,
      label: 'Wash',
      mobileLabel: 'Wash',
      subtitle: 'Wash Status Only',
      icon: Waves,
      count: counts.wash,
      color: 'text-emerald-700',
      allowedRoles: ['merchandiser', 'wash'] as UserRole[],
    },
    {
      id: 'finishing' as AppView,
      label: 'Finishing',
      mobileLabel: 'Finishing',
      subtitle: 'Finishing Status Only',
      icon: Sparkles,
      count: counts.finishing,
      color: 'text-emerald-700',
      allowedRoles: ['merchandiser'] as UserRole[],
    },
    {
      id: 'ready_for_parcel' as AppView,
      label: 'Ready for Parcel',
      mobileLabel: 'Parcel',
      subtitle: 'Parcel Status Only',
      icon: PackageCheck,
      count: counts.readyForParcel,
      color: 'text-emerald-700',
      allowedRoles: ['merchandiser'] as UserRole[],
    },
    {
      id: 'approvals' as AppView,
      label: 'Approval Comments',
      mobileLabel: 'Approvals',
      subtitle: 'Approval Status Only',
      icon: MessageSquare,
      count: counts.approvals,
      color: 'text-emerald-700',
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
      color: 'text-emerald-700',
      allowedRoles: ['merchandiser'] as UserRole[],
    },
    {
      id: 'fabric_inventory' as AppView,
      label: userRole === 'sewing' ? 'Fabric (View)' : 'Fabric',
      mobileLabel: 'Fabric',
      subtitle:
        userRole === 'sewing' ? 'View Only' : 'Stock & Yardage',
      icon: ScrollText,
      badge: counts.lowFabric > 0 ? `${counts.lowFabric} Low` : undefined,
      badgeVariant: counts.lowFabric > 0 ? 'critical' : 'neutral',
      color: 'text-emerald-700',
      allowedRoles: ['merchandiser', 'sewing'] as UserRole[],
    },
  ];

  const modules = allModules.filter((m) => m.allowedRoles.includes(userRole));
  const isCompactRole = modules.length <= 3;

  return (
    <nav
      aria-label="Main tracking modules top header navigation"
      className="w-full bg-white border-b border-emerald-200 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2">
        {/* Desktop-only Status Header */}
        <div className="hidden sm:flex items-center justify-between px-2 mb-1.5 text-[10px] text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="font-semibold text-emerald-900">
              Status-Based Dedicated Modules (Each Status Has Its Own Page)
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="text-slate-600">
              Req: <strong className="text-emerald-950">{counts.requisition ?? 0}</strong> · Sew: <strong className="text-emerald-950">{counts.sewing}</strong> · Wash: <strong className="text-emerald-950">{counts.wash}</strong> · Fin: <strong className="text-emerald-950">{counts.finishing}</strong> · Parcel: <strong className="text-emerald-950">{counts.readyForParcel}</strong> · Appr: <strong className="text-emerald-950">{counts.approvals}</strong>
            </span>
            {counts.lowFabric > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-semibold flex items-center gap-1">
                <AlertOctagon className="w-3 h-3 text-white" />
                {counts.lowFabric} Fabric Alert
              </span>
            )}
          </div>
        </div>

        {/* Single-Row Responsive Top Header Module Bar */}
        <div
          className={
            isCompactRole
              ? 'grid grid-cols-3 gap-1.5'
              : 'flex overflow-x-auto no-scrollbar gap-1.5 sm:grid sm:grid-cols-8'
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
                className={`relative min-h-[46px] ${
                  isCompactRole ? 'w-full' : 'min-w-[82px] sm:min-w-0 shrink-0'
                } flex flex-col sm:flex-row items-center justify-center sm:justify-between px-2 py-1.5 sm:py-2 rounded-xl transition-all group cursor-pointer text-left ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700'
                    : 'bg-emerald-50/50 text-slate-800 hover:bg-emerald-100/70 border border-emerald-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 min-w-0">
                  <div
                    className={`w-6 h-6 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-700'}`} />
                  </div>
                  <div className="hidden lg:block truncate min-w-0">
                    <div className={`font-semibold text-[11px] truncate leading-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {item.label}
                    </div>
                    <div
                      className={`text-[9px] truncate ${
                        isActive ? 'text-emerald-100' : 'text-slate-500'
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                  <span className={`lg:hidden text-[10px] sm:text-[11px] font-semibold truncate whitespace-nowrap ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {item.mobileLabel}
                  </span>
                </div>

                {/* Count / Badge Indicator */}
                <div className="hidden sm:flex items-center ml-1 shrink-0">
                  {item.count !== undefined ? (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold tabular-nums ${
                        isActive
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      {item.count}
                    </span>
                  ) : item.badge ? (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ${
                        item.badgeVariant === 'critical'
                          ? 'bg-red-600 text-white'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </div>

                {/* Compact Mobile Count Dot */}
                {item.count !== undefined && (
                  <span
                    className={`sm:hidden absolute top-1 right-1.5 text-[9px] font-mono font-bold tabular-nums px-1 rounded ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-emerald-900 border border-emerald-200'
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
