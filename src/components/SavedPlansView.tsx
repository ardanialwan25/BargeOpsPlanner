import { useState } from 'react';
import { FolderOpen, Search, Trash2 } from 'lucide-react';
import {
  calculateLotPlan,
  formatHoursToHm,
  formatNumberId,
  type PlanConfig,
  type ScopeOfWork,
  type SublotInput,
} from '../utils/productivity';

export interface SavedPlanRecord {
  id: string;
  savedAt: string;
  config: PlanConfig;
  sublots: SublotInput[];
}

interface SavedPlansViewProps {
  plans: SavedPlanRecord[];
  onLoadPlan: (record: SavedPlanRecord) => void;
  onDeletePlan: (id: string) => void;
}

export function SavedPlansView({
  plans,
  onLoadPlan,
  onDeletePlan,
}: SavedPlansViewProps) {
  const [query, setQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | ScopeOfWork>('all');

  const filtered = plans.filter((item) => {
    const matchesScope =
      scopeFilter === 'all' || item.config.scope === scopeFilter;
    const text = `${item.config.lotName} ${item.config.bargeName}`.toLowerCase();
    const matchesQuery =
      query.trim() === '' || text.includes(query.trim().toLowerCase());
    return matchesScope && matchesQuery;
  });

  return (
    <section
      aria-label="Riwayat Plan Barge"
      className="rounded-xl border border-slate-200 bg-white"
    >
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Riwayat Plan Productivity Barge
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Kelola dan muat ulang rencana Loading / Unloading Barge yang telah disimpan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama lot atau barge..."
                aria-label="Cari riwayat plan"
                className="w-56 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none"
              />
            </div>

            <div
              role="group"
              aria-label="Filter scope riwayat"
              className="inline-flex items-center rounded-lg bg-slate-100 p-1"
            >
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'loading_barge', label: 'Loading' },
                  { id: 'unloading_barge', label: 'Unloading' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setScopeFilter(opt.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    scopeFilter === opt.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="font-display text-sm font-semibold text-slate-900">
            Tidak ada rencana yang cocok
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Simpan perhitungan dari tab Kalkulator Lot atau ubah kata kunci pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="py-3 pl-5 pr-3">Lot & Barge</th>
                <th className="px-3 py-3">Scope</th>
                <th className="px-3 py-3 text-right">Sublot</th>
                <th className="px-3 py-3 text-right">Total Qty</th>
                <th className="px-3 py-3 text-right">Total Increment</th>
                <th className="px-3 py-3 text-right">Manpower / Rek.</th>
                <th className="px-3 py-3 text-right">Waktu Optimal</th>
                <th className="px-3 py-3 text-right">Productivity</th>
                <th className="py-3 pl-3 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((record) => {
                const s = calculateLotPlan(record.sublots, record.config);
                const scopeLabel =
                  record.config.scope === 'loading_barge'
                    ? 'Loading Barge'
                    : 'Unloading Barge';

                return (
                  <tr
                    key={record.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="py-3 pl-5 pr-3">
                      <div className="text-xs font-bold text-slate-900">
                        {record.config.lotName || 'Tanpa Nama Lot'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {record.config.bargeName || '—'} · {record.savedAt}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-slate-700">
                      {scopeLabel}
                    </td>
                    <td className="font-mono-tabular px-3 py-3 text-right text-xs text-slate-700">
                      {record.sublots.length}
                    </td>
                    <td className="font-mono-tabular px-3 py-3 text-right text-xs font-semibold text-slate-900">
                      {formatNumberId(s.totalQuantityMt, 1)} MT
                    </td>
                    <td className="font-mono-tabular px-3 py-3 text-right text-xs font-semibold text-sky-700">
                      {formatNumberId(s.totalIncrementsExact, 1)} Inc
                    </td>
                    <td className="font-mono-tabular px-3 py-3 text-right text-xs text-slate-800">
                      {record.config.plannedManpower} /{' '}
                      <span className="font-bold">{s.recommendedManpowerTotal}</span> Org
                    </td>
                    <td className="font-mono-tabular px-3 py-3 text-right text-xs font-medium text-slate-900">
                      {formatHoursToHm(s.optimalHours)}
                    </td>
                    <td className="font-mono-tabular px-3 py-3 text-right text-xs font-semibold text-slate-900">
                      {formatNumberId(s.planProductivityMtPerHour, 1)} MT/j
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onLoadPlan(record)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-sky-600 hover:text-sky-700 whitespace-nowrap"
                        >
                          <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Muat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePlan(record.id)}
                          aria-label={`Hapus plan ${record.config.lotName}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
