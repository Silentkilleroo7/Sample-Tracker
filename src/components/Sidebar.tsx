import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Waves,
  Sparkles,
  PackageCheck,
  ScrollText,
  ChevronRight,
  TrendingUp,
  FlaskConical,
} from 'lucide-react';

export type AppView = 
  | 'dashboard' 
  | 'all_samples' 
  | 'styles'
  | 'wash' 
  | 'finishing' 
  | 'ready_for_parcel'
  | 'approvals' 
  | 'test'
  | 'fabric_inventory';

interface SidebarProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  counts: {
    total: number;
    stylesCount?: number;
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

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  counts,
}) => {
  const navItems = [
    {
      id: 'dashboard' as AppView,
      label: 'Dashboard',
      subtitle: 'KPIs & Summary Overview',
      icon: LayoutDashboard,
      badge: counts.lowFabric > 0 ? `${counts.lowFabric} Alert` : undefined,
      badgeVariant: counts.lowFabric > 0 ? 'critical' : 'neutral',
      color: 'text-indigo-400',
    },
    {
      id: 'all_samples' as AppView,
      label: 'Samples',
      subtitle: 'Pipeline & Requisition',
      icon: Layers,
      count: counts.total,
      color: 'text-purple-400',
    },
    {
      id: 'styles' as AppView,
      label: 'Styles',
      subtitle: 'Styles & Colorways',
      icon: Layers,
      count: counts.stylesCount,
      color: 'text-emerald-400',
    },
    {
      id: 'wash' as AppView,
      label: 'Wash',
      subtitle: 'Wet Wash Treatments',
      icon: Waves,
      count: counts.wash,
      color: 'text-cyan-400',
    },
    {
      id: 'finishing' as AppView,
      label: 'Finishing',
      subtitle: 'Ironing, Trims & QA',
      icon: Sparkles,
      count: counts.finishing,
      color: 'text-amber-400',
    },
    {
      id: 'approvals' as AppView,
      label: 'Parcel & Approval',
      subtitle: 'AWB, Workbook & Comments',
      icon: PackageCheck,
      count: counts.readyForParcel + counts.approvals,
      color: 'text-emerald-400',
    },
    {
      id: 'test' as AppView,
      label: 'Test',
      subtitle: 'BV Testing & 24h Re-Test',
      icon: FlaskConical,
      badge: (counts.testOverdue && counts.testOverdue > 0) ? `${counts.testOverdue} Re-Test!` : undefined,
      badgeVariant: (counts.testOverdue && counts.testOverdue > 0) ? 'critical' : 'neutral',
      count: counts.testCount,
      color: 'text-blue-400',
    },
    {
      id: 'fabric_inventory' as AppView,
      label: 'Fabric',
      subtitle: 'Stock & Linked Styles',
      icon: ScrollText,
      badge: counts.lowFabric > 0 ? `${counts.lowFabric} Critical` : undefined,
      badgeVariant: counts.lowFabric > 0 ? 'critical' : 'neutral',
      color: counts.lowFabric > 0 ? 'text-rose-400' : 'text-slate-300',
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-900/60 backdrop-blur-md border-r border-slate-800 p-4 shrink-0 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Main Tracking Modules
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : item.color || 'text-slate-400'
                      }`}
                    />
                    <div className="truncate">
                      <div className="font-semibold leading-tight truncate">
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive ? 'text-indigo-200' : 'text-slate-500'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    {item.badge ? (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
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
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                          isActive
                            ? 'bg-indigo-700/60 text-white'
                            : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {item.count}
                      </span>
                    ) : null}
                    <ChevronRight
                      className={`w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity ${
                        isActive ? 'text-white' : 'text-slate-500'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Live Status Summary Card in Sidebar */}
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 hidden lg:block">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              Pipeline Velocity
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">96% On-Time</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span> In Sewing:
              </span>
              <span className="font-mono font-bold">{counts.sewing}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span> In Wash:
              </span>
              <span className="font-mono font-bold">{counts.wash}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> In Finishing:
              </span>
              <span className="font-mono font-bold">{counts.finishing}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Ready Parcel:
              </span>
              <span className="font-mono font-bold">{counts.readyForParcel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Production Station Info Footer */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 hidden lg:block">
        <div className="flex items-center justify-between">
          <span>Factory Floor: Plant #1</span>
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Sync Active
          </span>
        </div>
        <p className="mt-1 text-[10px] text-slate-600">Sample Merchandising & QA Unit</p>
      </div>
    </aside>
  );
};
