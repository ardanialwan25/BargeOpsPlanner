import { useEffect, useMemo, useState } from 'react';
import { KpiStrip } from './components/KpiStrip';
import { ManpowerPanel } from './components/ManpowerPanel';
import {
  SavedPlansView,
  type SavedPlanRecord,
} from './components/SavedPlansView';
import { ManpowerSimulation } from './components/ManpowerSimulation';
import { SublotTable } from './components/SublotTable';
import { TopBar, type ActiveTab } from './components/TopBar';
import {
  applySublotPatch,
  buildCsvReport,
  calculateLotPlan,
  DEFAULT_INCREMENTS_PER_PERSON,
  DEFAULT_INCREMENTS_PER_SUBLOT,
  DEFAULT_SHIFT_HOURS,
  generateSublotsFromTotal,
  type PlanConfig,
  type SublotInput,
} from './utils/productivity';

const INITIAL_CONFIG: PlanConfig = {
  scope: 'loading_barge',
  lotName: 'Lot 01 - Thermal Coal 4200 GAR',
  bargeName: 'BG. Nusantara 3001',
  bargeTotalQuantityMt: 7500,
  defaultTruckFactor: 25,
  plannedManpower: 4,
  shiftHours: DEFAULT_SHIFT_HOURS,
  incrementsPerSublot: DEFAULT_INCREMENTS_PER_SUBLOT,
  incrementsPerPerson: DEFAULT_INCREMENTS_PER_PERSON,
  useJettyCap: false,
  maxJettyRateDtPerHour: 35,
};

const INITIAL_SUBLOTS: SublotInput[] = [
  {
    id: 'sublot-1',
    name: 'Sublot 01',
    quantityMt: 2500,
    truckFactor: 25,
    mode: 'manual',
  },
  {
    id: 'sublot-2',
    name: 'Sublot 02',
    quantityMt: 2500,
    truckFactor: 25,
    mode: 'manual',
  },
  {
    id: 'sublot-3',
    name: 'Sublot 03',
    quantityMt: 2500,
    truckFactor: 25,
    mode: 'manual',
  },
];

const SEED_SAVED_PLANS: SavedPlanRecord[] = [
  {
    id: 'seed-plan-1',
    savedAt: '26 Nov 2026, 08:30',
    config: {
      scope: 'loading_barge',
      lotName: 'Lot A - Jetty Sungai Mahakam',
      bargeName: 'BG. Maritim Jaya 270',
      bargeTotalQuantityMt: 7500,
      plannedManpower: 6,
      shiftHours: 8,
      incrementsPerSublot: 100,
      incrementsPerPerson: 50,
      useJettyCap: false,
      maxJettyRateDtPerHour: 35,
    },
    sublots: [
      { id: 's1', name: 'Sublot 01', quantityMt: 2500, truckFactor: 25, mode: 'manual' },
      { id: 's2', name: 'Sublot 02', quantityMt: 2500, truckFactor: 25, mode: 'manual' },
      { id: 's3', name: 'Sublot 03', quantityMt: 2500, truckFactor: 25, mode: 'manual' },
    ],
  },
  {
    id: 'seed-plan-2',
    savedAt: '25 Nov 2026, 14:15',
    config: {
      scope: 'unloading_barge',
      lotName: 'Lot B - Dermaga PLTU',
      bargeName: 'BG. Samudra 330',
      bargeTotalQuantityMt: 10500,
      plannedManpower: 8,
      shiftHours: 8,
      incrementsPerSublot: 100,
      incrementsPerPerson: 50,
      useJettyCap: false,
      maxJettyRateDtPerHour: 40,
    },
    sublots: [
      { id: 'u1', name: 'Sublot 01', quantityMt: 3000, truckFactor: 30, mode: 'manual' },
      { id: 'u2', name: 'Sublot 02', quantityMt: 3000, truckFactor: 30, mode: 'manual' },
      { id: 'u3', name: 'Sublot 03', quantityMt: 2500, truckFactor: 25, mode: 'manual' },
      { id: 'u4', name: 'Sublot 04', quantityMt: 2000, truckFactor: 25, mode: 'manual' },
    ],
  },
];

const STORAGE_KEY_PLANS = 'bargeops_saved_plans_v1';

function loadSavedPlans(): SavedPlanRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLANS);
    if (!raw) return SEED_SAVED_PLANS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return SEED_SAVED_PLANS;
  } catch {
    return SEED_SAVED_PLANS;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');
  const [config, setConfig] = useState<PlanConfig>(INITIAL_CONFIG);
  const [sublots, setSublots] = useState<SublotInput[]>(INITIAL_SUBLOTS);
  const [savedPlans, setSavedPlans] = useState<SavedPlanRecord[]>(() =>
    loadSavedPlans()
  );
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(savedPlans));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedPlans]);

  const summary = useMemo(
    () => calculateLotPlan(sublots, config),
    [sublots, config]
  );

  const handleUpdateConfig = (patch: Partial<PlanConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);

    const shouldAutoBreakdown =
      patch.bargeTotalQuantityMt !== undefined ||
      patch.defaultTruckFactor !== undefined ||
      patch.incrementsPerSublot !== undefined;

    if (shouldAutoBreakdown) {
      const totalQty = next.bargeTotalQuantityMt ?? 0;
      const tf = next.defaultTruckFactor ?? 0;
      const incPerSub = next.incrementsPerSublot ?? 0;
      if (totalQty > 0 && tf > 0 && incPerSub > 0) {
        const generated = generateSublotsFromTotal(totalQty, tf, incPerSub);
        if (generated.length > 0) {
          setSublots(generated);
        }
      }
    }
  };

  const handleUpdateSublot = (
    id: string,
    patch: Partial<SublotInput> & { directIncrements?: number }
  ) => {
    setSublots((prev) =>
      prev.map((item) =>
        item.id === id ? applySublotPatch(item, { ...patch, mode: 'manual' }) : item
      )
    );
  };

  const handleAddSublot = () => {
    const nextNum = sublots.length + 1;
    const lastTf =
      sublots.length > 0 && sublots[sublots.length - 1].truckFactor > 0
        ? sublots[sublots.length - 1].truckFactor
        : 25;
    const newSublot: SublotInput = {
      id: `sublot-${Date.now()}-${nextNum}`,
      name: `Sublot ${String(nextNum).padStart(2, '0')}`,
      quantityMt: lastTf * 50,
      truckFactor: lastTf,
      mode: 'manual',
    };
    setSublots((prev) => [...prev, newSublot]);
  };

  const handleRemoveSublot = (id: string) => {
    setSublots((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetDefault = () => {
    setConfig(INITIAL_CONFIG);
    setSublots(INITIAL_SUBLOTS);
  };

  const handleSavePlan = () => {
    if (!summary.hasValidSublots || summary.configError) return;
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);

    const record: SavedPlanRecord = {
      id: `plan-${Date.now()}`,
      savedAt: formattedDate,
      config: { ...config },
      sublots: sublots.map((s) => ({ ...s })),
    };

    setSavedPlans((prev) => [record, ...prev]);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2000);
  };

  const handleLoadPlan = (record: SavedPlanRecord) => {
    setConfig({ ...record.config });
    setSublots(record.sublots.map((s) => ({ ...s, mode: 'manual' })));
    setActiveTab('calculator');
  };

  const handleDeletePlan = (id: string) => {
    setSavedPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const handleExportCsv = () => {
    if (!summary.hasValidSublots || summary.configError) return;
    const csv = buildCsvReport(config, summary);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (config.lotName || 'barge_plan')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');
    link.href = url;
    link.setAttribute('download', `${safeName}_productivity.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const scopeLabel =
    config.scope === 'loading_barge' ? 'Loading Barge' : 'Unloading Barge';

  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onExportCsv={handleExportCsv}
        canExport={summary.hasValidSublots && !summary.configError}
        historyCount={savedPlans.length}
      />

      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header Context */}
        <div className="mb-5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px] text-balance">
            Plan Productivity {scopeLabel}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span>{config.lotName || 'Lot Aktif'}</span>
            <span aria-hidden="true">·</span>
            <span>{config.bargeName || 'Barge'}</span>
            <span aria-hidden="true">·</span>
            <span>1 Dump Truck = 1 Increment</span>
            <span aria-hidden="true">·</span>
            <span>Target 1 Personel = {config.incrementsPerPerson} Increment</span>
          </div>
        </div>

        {/* Executive Summary Strip */}
        <div className="mb-6">
          <KpiStrip config={config} summary={summary} />
        </div>

        {/* Active View Content */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            <div className="lg:col-span-8">
              <SublotTable
                config={config}
                sublots={sublots}
                summary={summary}
                onUpdateConfig={handleUpdateConfig}
                onUpdateSublot={handleUpdateSublot}
                onAddSublot={handleAddSublot}
                onRemoveSublot={handleRemoveSublot}
                onResetDefault={handleResetDefault}
                onSavePlan={handleSavePlan}
                justSaved={justSaved}
              />
            </div>

            <div className="lg:col-span-4">
              <ManpowerPanel
                config={config}
                summary={summary}
                onUpdateConfig={handleUpdateConfig}
              />
            </div>
          </div>
        )}

        {activeTab === 'simulation' && (
          <ManpowerSimulation
            config={config}
            sublots={sublots}
            summary={summary}
            onApplyManpower={(mp) => {
              handleUpdateConfig({ plannedManpower: mp });
              setActiveTab('calculator');
            }}
          />
        )}

        {activeTab === 'history' && (
          <SavedPlansView
            plans={savedPlans}
            onLoadPlan={handleLoadPlan}
            onDeletePlan={handleDeletePlan}
          />
        )}
      </main>
    </div>
  );
}
