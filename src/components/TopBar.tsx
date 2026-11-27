import { Download } from 'lucide-react';

export type ActiveTab = 'calculator' | 'simulation' | 'history';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onExportCsv: () => void;
  canExport: boolean;
  historyCount: number;
}

export function TopBar({
  activeTab,
  onSelectTab,
  onExportCsv,
  canExport,
  historyCount,
}: TopBarProps) {
  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'calculator', label: 'Kalkulator Lot' },
    { id: 'simulation', label: 'Simulasi Manpower' },
    { id: 'history', label: `Riwayat Plan (${historyCount})` },
  ];

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-4 py-3 sm:px-6 md:gap-8 md:py-3.5 lg:px-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('calculator');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-700"
        >
          BargeOps Planner
        </a>

        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-6"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-1.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-700 ${
                  isActive
                    ? 'text-sky-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-3.5 h-0.5 bg-sky-700"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onExportCsv}
            disabled={!canExport}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 sm:px-4"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation strip (compact, under 15% viewport height total) */}
      <nav
        aria-label="Navigasi seluler"
        className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-slate-100 px-4 py-2"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`py-1 text-xs font-medium whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-sky-700 font-semibold underline decoration-2 underline-offset-4'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
