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
      subtitle: 'Ironing & QA',
      icon: Sparkles,
      count: counts.finishing,
      color: 'text-amber-400',
      allowedRoles: ['merchandiser'] as UserRole[],
    },
    {
      id: 'approvals' as AppView,
      label: 'Parcel & Approval',
      subtitle: 'Courier & Comments',
      icon: PackageCheck,
      count: counts.readyForParcel + counts.approvals,
      color: 'text-emerald-400',
      allowedRoles: ['merchandiser'] as UserRole[],
    },
    {
      id: 'test' as AppView,
      label: 'Test',
      subtitle: 'BV Testing & 24h Re-Test',
      icon: FlaskConical,
      badge: (counts.testOverdue && counts.testOverdue > 0) ? `${counts.testOverdue} 24h!` : undefined,
      badgeVariant: (counts.testOverdue && counts.testOverdue > 0) ? 'critical' : 'neutral',
      count: counts.testCount,
      color: (counts.testOverdue && counts.testOverdue > 0) ? 'text-rose-400' : 'text-blue-400',
      allowedRoles: ['merchandiser'] as UserRole[],
    },
    {
      id: 'fabric_inventory' as AppView,
      label: userRole === 'sewing' ? 'Fabric (View Mode)' : 'Fabric',
      subtitle: userRole === 'sewing' ? 'View Only • No Access' : 'Stock & Yardage',
      icon: ScrollText,
      badge: counts.lowFabric > 0 ? `${counts.lowFabric} Low` : undefined,
      badgeVariant: counts.lowFabric > 0 ? 'critical' : 'neutral',
      color: counts.lowFabric > 0 ? 'text-rose-400' : 'text-slate-300',
      allowedRoles: ['merchandiser', 'sewing'] as UserRole[],
    },
  ];

  const modules = allModules.filter((m) => m.allowedRoles.includes(userRole));

  return (
    <div className="sticky bottom-0 z-40 w-full bg-slate-950/95 backdrop-blur-xl border-t-2 border-indigo-500/40 shadow-2xl shadow-black ring-1 ring-white/10">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2">
        {/* Section Header / Category Tag */}
        <div className="flex items-center justify-between px-2 mb-1.5 text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono font-black uppercase tracking-widest text-indigo-300">
              MAIN TRACKING MODULES
            </span>
            <span className="text-slate-500 hidden sm:inline">• Bottom Navigation Hub</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="text-slate-400 hidden md:inline">
              In Pipeline: <strong className="text-white">{counts.total}</strong> styles
            </span>
            {counts.lowFabric > 0 && (
              <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                <AlertOctagon className="w-3 h-3" />
                {counts.lowFabric} Fabric Alert!
              </span>
            )}
          </div>
        </div>

        {/* Modules Grid / Dock */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 sm:gap-1.5">
          {modules.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`relative flex flex-col sm:flex-row items-center justify-center sm:justify-between px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl transition-all group cursor-pointer text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/40 ring-1 ring-indigo-400/50 scale-[1.02]'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-400 rounded-full shadow-sm shadow-indigo-300"></span>
                )}

                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                  </div>
                  <div className="hidden lg:block truncate min-w-0">
                    <div className="font-bold text-xs truncate leading-tight">
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
                  <span className="lg:hidden text-[11px] font-bold mt-1 sm:mt-0 truncate">
                    {item.label}
                  </span>
                </div>

                {/* Badge or Count */}
                <div className="hidden sm:flex items-center ml-1 shrink-0">
                  {item.badge ? (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.badgeVariant === 'critical'
                          ? isActive
                            ? 'bg-rose-500 text-white'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : item.count !== undefined ? (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                        isActive
                          ? 'bg-indigo-800 text-white'
                          : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {item.count}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
