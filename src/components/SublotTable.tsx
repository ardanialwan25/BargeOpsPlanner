import { Layers, Plus, RotateCcw, Save, Trash2, Wand2 } from 'lucide-react';
import {
  formatNumberId,
  type LotPlanSummary,
  type PlanConfig,
  type ScopeOfWork,
  type SublotInput,
} from '../utils/productivity';

interface SublotTableProps {
  config: PlanConfig;
  sublots: SublotInput[];
  summary: LotPlanSummary;
  onUpdateConfig: (patch: Partial<PlanConfig>) => void;
  onUpdateSublot: (
    id: string,
    patch: Partial<SublotInput> & { directIncrements?: number }
  ) => void;
  onAddSublot: () => void;
  onRemoveSublot: (id: string) => void;
  onResetDefault: () => void;
  onSavePlan: () => void;
  justSaved: boolean;
}

export function SublotTable({
  config,
  sublots,
  summary,
  onUpdateConfig,
  onUpdateSublot,
  onAddSublot,
  onRemoveSublot,
  onResetDefault,
  onSavePlan,
  justSaved,
}: SublotTableProps) {
  const setScope = (scope: ScopeOfWork) => {
    onUpdateConfig({ scope });
  };

  const totalQty = config.bargeTotalQuantityMt ?? 0;
  const truckFactor = config.defaultTruckFactor ?? 0;
  const incPerSublot = config.incrementsPerSublot ?? 0;
  const hasValidGeneratorInputs =
    totalQty > 0 && truckFactor > 0 && incPerSublot > 0;
  const projectedTotalInc = hasValidGeneratorInputs
    ? totalQty / truckFactor
    : 0;
  const projectedSublotCount = hasValidGeneratorInputs
    ? Math.ceil(projectedTotalInc / incPerSublot - 1e-9)
    : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* Header & Lot Controls */}
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Data Lot & Breakdown Sublot
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Input Total Qty, Truck Factor & Dump Truck/Increment per Sublot untuk auto-breakdown otomatis
            </p>
          </div>

          <div
            role="group"
            aria-label="Pilih Scope of Work"
            className="inline-flex items-center rounded-lg bg-slate-100 p-1 self-start sm:self-auto"
          >
            <button
              type="button"
              onClick={() => setScope('loading_barge')}
              aria-pressed={config.scope === 'loading_barge'}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 ${
                config.scope === 'loading_barge'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Loading Barge
            </button>
            <button
              type="button"
              onClick={() => setScope('unloading_barge')}
              aria-pressed={config.scope === 'unloading_barge'}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 ${
                config.scope === 'unloading_barge'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unloading Barge
            </button>
          </div>
        </div>

        {/* Lot & Barge Name */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="lot-name-input"
              className="block text-xs font-medium text-slate-600"
            >
              Nama Lot
            </label>
            <input
              id="lot-name-input"
              type="text"
              value={config.lotName}
              onChange={(e) => onUpdateConfig({ lotName: e.target.value })}
              placeholder="Contoh: Lot 01 - Coal Thermal"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600/15"
            />
          </div>
          <div>
            <label
              htmlFor="barge-name-input"
              className="block text-xs font-medium text-slate-600"
            >
              Nama Barge / Tongkang
            </label>
            <input
              id="barge-name-input"
              type="text"
              value={config.bargeName}
              onChange={(e) => onUpdateConfig({ bargeName: e.target.value })}
              placeholder="Contoh: BG. Nusantara 3001"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600/15"
            />
          </div>
        </div>

        {/* Auto-Generator Breakdown Inputs */}
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Wand2 className="h-3.5 w-3.5 text-sky-700" aria-hidden="true" />
              <span>Auto-Generator Breakdown Sublot</span>
            </div>
            {hasValidGeneratorInputs ? (
              <p className="text-xs text-slate-600 tabular-nums">
                Hasil:{' '}
                <span className="font-mono-tabular font-bold text-sky-700">
                  {projectedSublotCount} Sublot
                </span>{' '}
                · Total{' '}
                <span className="font-mono-tabular font-semibold text-slate-900">
                  {formatNumberId(projectedTotalInc, 2)} Dump Truck / Inc
                </span>
              </p>
            ) : (
              <p className="text-xs font-medium text-amber-700">
                Isi ketiga angka di bawah (&gt; 0) untuk auto-breakdown sublot
              </p>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="barge-total-qty-input"
                className="block text-xs font-medium text-slate-700"
              >
                Qty Total 1 Tongkang (MT)
              </label>
              <div className="relative mt-1">
                <input
                  id="barge-total-qty-input"
                  type="number"
                  min="0"
                  step="any"
                  value={config.bargeTotalQuantityMt || ''}
                  onChange={(e) =>
                    onUpdateConfig({
                      bargeTotalQuantityMt:
                        e.target.value === '' ? 0 : Number(e.target.value),
                    })
                  }
                  placeholder="Contoh: 7500"
                  className="font-mono-tabular w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
                  MT
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="auto-truck-factor-input"
                className="block text-xs font-medium text-slate-700"
              >
                Truck Factor (MT/DT)
              </label>
              <div className="relative mt-1">
                <input
                  id="auto-truck-factor-input"
                  type="number"
                  min="0"
                  step="any"
                  value={config.defaultTruckFactor || ''}
                  onChange={(e) =>
                    onUpdateConfig({
                      defaultTruckFactor:
                        e.target.value === '' ? 0 : Number(e.target.value),
                    })
                  }
                  placeholder="Contoh: 25"
                  className="font-mono-tabular w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-14 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
                  MT/DT
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="auto-inc-per-sublot-input"
                className="block text-xs font-medium text-slate-700"
              >
                Dump Truck / Inc per Sublot
              </label>
              <div className="relative mt-1">
                <input
                  id="auto-inc-per-sublot-input"
                  type="number"
                  min="1"
                  step="1"
                  value={config.incrementsPerSublot || ''}
                  onChange={(e) =>
                    onUpdateConfig({
                      incrementsPerSublot:
                        e.target.value === '' ? 0 : Number(e.target.value),
                    })
                  }
                  placeholder="Contoh: 100"
                  className="font-mono-tabular w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-16 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
                  Inc/Sub
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sublots Table */}
      {sublots.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Layers className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-3 font-display text-sm font-semibold text-slate-900">
            Belum ada sublot pada Lot ini
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Isi Qty Total 1 Tongkang, Truck Factor, dan Dump Truck / Inc per Sublot di atas, atau tambahkan sublot manual.
          </p>
          <button
            type="button"
            onClick={onAddSublot}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tambah Sublot Pertama</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                <th className="py-3 pl-5 pr-3">Sublot</th>
                <th className="px-3 py-3 text-right">Quantity (MT)</th>
                <th className="px-3 py-3 text-right">Truck Factor (MT/DT)</th>
                <th className="px-3 py-3 text-right">Dump Truck / Increment</th>
                <th className="py-3 pl-3 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sublots.map((raw, idx) => {
                const calc = summary.sublots[idx];

                return (
                  <tr
                    key={raw.id}
                    className={`transition-colors hover:bg-slate-50/60 ${
                      calc && !calc.isValid ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <td className="py-3 pl-5 pr-3 align-top">
                      <input
                        type="text"
                        aria-label={`Nama ${raw.name || `Sublot ${idx + 1}`}`}
                        value={raw.name}
                        onChange={(e) =>
                          onUpdateSublot(raw.id, { name: e.target.value })
                        }
                        className="w-32 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
                      />
                      {calc && !calc.isValid && calc.error && (
                        <p className="mt-1 text-[11px] font-medium text-rose-600">
                          {calc.error}
                        </p>
                      )}
                    </td>

                    <td className="px-3 py-3 align-top text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        aria-label={`Quantity MT untuk ${raw.name}`}
                        value={Number.isNaN(raw.quantityMt) ? '' : raw.quantityMt}
                        onChange={(e) =>
                          onUpdateSublot(raw.id, {
                            mode: 'manual',
                            quantityMt:
                              e.target.value === '' ? 0 : Number(e.target.value),
                          })
                        }
                        className="font-mono-tabular w-28 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-right text-xs font-semibold text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
                      />
                    </td>

                    <td className="px-3 py-3 align-top text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        aria-label={`Truck Factor untuk ${raw.name}`}
                        value={Number.isNaN(raw.truckFactor) ? '' : raw.truckFactor}
                        onChange={(e) =>
                          onUpdateSublot(raw.id, {
                            mode: 'manual',
                            truckFactor:
                              e.target.value === '' ? 0 : Number(e.target.value),
                          })
                        }
                        className="font-mono-tabular w-24 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-right text-xs font-semibold text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
                      />
                    </td>

                    <td className="px-3 py-3 align-top text-right">
                      <div className="inline-flex flex-col items-end">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            aria-label={`Increment untuk ${raw.name}`}
                            value={
                              calc?.isValid
                                ? Number(calc.incrementsExact.toFixed(2))
                                : ''
                            }
                            onChange={(e) =>
                              onUpdateSublot(raw.id, {
                                directIncrements:
                                  e.target.value === ''
                                    ? 0
                                    : Number(e.target.value),
                              })
                            }
                            className="font-mono-tabular w-24 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 pr-8 text-right text-xs font-bold text-sky-700 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[11px] font-medium text-slate-400">
                            Inc
                          </span>
                        </div>
                        <span className="font-mono-tabular mt-1 text-[11px] text-slate-500">
                          {calc?.isValid
                            ? `${formatNumberId(calc.dumpTrucksRounded, 0)} DT · ${calc.recommendedManpower} MP`
                            : 'Invalid'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 pl-3 pr-5 align-top text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveSublot(raw.id)}
                        aria-label={`Hapus ${raw.name || `Sublot ${idx + 1}`}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-sky-700"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                <td className="py-3.5 pl-5 pr-3 text-xs font-bold text-slate-700">
                  TOTAL LOT ({sublots.length} Sublot)
                </td>
                <td className="font-mono-tabular px-3 py-3.5 text-right text-xs font-bold">
                  {formatNumberId(summary.totalQuantityMt, 2)} MT
                </td>
                <td className="px-3 py-3.5 text-right text-xs text-slate-500">
                  Avg{' '}
                  <span className="font-mono-tabular text-slate-700">
                    {summary.totalDumpTrucksExact > 0
                      ? formatNumberId(
                          summary.totalQuantityMt / summary.totalDumpTrucksExact,
                          2
                        )
                      : '—'}
                  </span>
                </td>
                <td className="font-mono-tabular px-3 py-3.5 text-right text-xs font-bold text-sky-700">
                  {formatNumberId(summary.totalIncrementsExact, 2)} Inc
                  <span className="ml-1.5 font-normal text-slate-500">
                    ({summary.recommendedManpowerTotal} MP)
                  </span>
                </td>
                <td className="py-3.5 pl-3 pr-5 text-right" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={onAddSublot}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Tambah Sublot</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetDefault}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={onSavePlan}
            disabled={!summary.hasValidSublots || Boolean(summary.configError)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 whitespace-nowrap"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{justSaved ? 'Tersimpan' : 'Simpan Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
