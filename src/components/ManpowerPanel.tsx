import { AlertCircle, CheckCircle2, Minus, Plus } from 'lucide-react';
import {
  formatHoursToHm,
  formatNumberId,
  type LotPlanSummary,
  type PlanConfig,
} from '../utils/productivity';

interface ManpowerPanelProps {
  config: PlanConfig;
  summary: LotPlanSummary;
  onUpdateConfig: (patch: Partial<PlanConfig>) => void;
}

export function ManpowerPanel({
  config,
  summary,
  onUpdateConfig,
}: ManpowerPanelProps) {
  const shiftPresets = [8, 10, 12];
  const utilClamp = Math.min(100, Math.max(0, summary.utilizationPercent));

  const handleStepManpower = (delta: number) => {
    const next = Math.max(1, (config.plannedManpower || 1) + delta);
    onUpdateConfig({ plannedManpower: next });
  };

  return (
    <aside
      aria-label="Pengaturan Manpower dan Target"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900">
            Parameter Manpower & Target
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Atur manpower, target increment/personel & durasi shift
          </p>
        </div>
        {summary.manpowerStatus === 'optimal' && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Optimal
          </span>
        )}
      </div>

      {summary.configError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-800"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
            aria-hidden="true"
          />
          <span>{summary.configError}</span>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {/* Planned Manpower */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="planned-manpower-input"
              className="text-xs font-semibold text-slate-700"
            >
              Jumlah Manpower
            </label>
            {summary.hasValidSublots &&
              !summary.configError &&
              summary.recommendedManpowerTotal > 0 &&
              config.plannedManpower !== summary.recommendedManpowerTotal && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConfig({
                      plannedManpower: summary.recommendedManpowerTotal,
                    })
                  }
                  className="text-xs font-semibold text-sky-700 hover:text-sky-800 hover:underline"
                >
                  Pakai Rekomendasi ({summary.recommendedManpowerTotal} Org)
                </button>
              )}
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStepManpower(-1)}
              aria-label="Kurangi manpower"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="relative flex-1">
              <input
                id="planned-manpower-input"
                type="number"
                min="1"
                step="1"
                value={config.plannedManpower || ''}
                onChange={(e) =>
                  onUpdateConfig({
                    plannedManpower:
                      e.target.value === ''
                        ? 0
                        : Math.floor(Number(e.target.value)),
                  })
                }
                className="font-mono-tabular h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 pr-16 text-center text-sm font-bold text-slate-900 focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600/15"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
                Personel
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleStepManpower(1)}
              aria-label="Tambah manpower"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Target Increment / Personel */}
        <div>
          <label
            htmlFor="inc-per-person-input"
            className="block text-xs font-semibold text-slate-700"
          >
            Target Increment / Personel
          </label>
          <div className="relative mt-1.5">
            <input
              id="inc-per-person-input"
              type="number"
              min="1"
              step="1"
              value={config.incrementsPerPerson || ''}
              onChange={(e) =>
                onUpdateConfig({
                  incrementsPerPerson:
                    e.target.value === '' ? 0 : Number(e.target.value),
                })
              }
              className="font-mono-tabular h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 pr-24 text-sm font-bold text-slate-900 focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600/15"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
              Inc / Personel
            </span>
          </div>
        </div>

        {/* Shift Duration */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="shift-hours-input"
              className="text-xs font-semibold text-slate-700"
            >
              Durasi per Shift
            </label>
            <div className="flex items-center gap-1">
              {shiftPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onUpdateConfig({ shiftHours: preset })}
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                    config.shiftHours === preset
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset}j
                </button>
              ))}
            </div>
          </div>

          <div className="relative mt-1.5">
            <input
              id="shift-hours-input"
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={config.shiftHours || ''}
              onChange={(e) =>
                onUpdateConfig({
                  shiftHours: e.target.value === '' ? 0 : Number(e.target.value),
                })
              }
              className="font-mono-tabular h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 pr-14 text-sm font-semibold text-slate-900 focus:border-sky-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600/15"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400">
              Jam
            </span>
          </div>
        </div>

        {/* Concise Workload Summary */}
        <dl className="divide-y divide-slate-100 border-t border-slate-100 pt-2 text-xs">
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-slate-600">Beban per Personel</dt>
            <dd className="font-mono-tabular font-semibold text-slate-900">
              {summary.hasValidSublots && !summary.configError
                ? `${formatNumberId(summary.workloadPerPersonInc, 1)} / ${config.incrementsPerPerson} Inc`
                : '—'}
            </dd>
          </div>

          <div className="py-2.5">
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Utilisasi Kapasitas</dt>
              <dd
                className={`font-mono-tabular font-semibold ${
                  summary.utilizationPercent > 100
                    ? 'text-amber-700'
                    : 'text-slate-900'
                }`}
              >
                {summary.hasValidSublots && !summary.configError
                  ? `${formatNumberId(summary.utilizationPercent, 1)}%`
                  : '—'}
              </dd>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  summary.utilizationPercent > 100
                    ? 'bg-amber-500'
                    : summary.utilizationPercent >= 80
                      ? 'bg-emerald-600'
                      : 'bg-sky-600'
                }`}
                style={{ width: `${utilClamp}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <dt className="text-slate-600">Waktu Estimasi Aktual</dt>
            <dd className="font-mono-tabular font-semibold text-slate-900">
              {summary.hasValidSublots && !summary.configError
                ? formatHoursToHm(summary.estimatedHoursActual)
                : '—'}
            </dd>
          </div>

          {summary.bargeTotalQuantityMt > 0 && summary.hasValidSublots && !summary.configError && (
            <div className="py-2.5">
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">
                  Proyeksi 1 Tongkang ({formatNumberId(summary.bargeTotalQuantityMt, 0)} MT)
                </dt>
                <dd className="font-mono-tabular font-semibold text-sky-700">
                  {formatNumberId(summary.bargeProjectedIncrements, 1)} Inc ·{' '}
                  {summary.bargeRecommendedManpower} Org
                </dd>
              </div>
              <p className="mt-1 text-right text-[11px] text-slate-500 tabular-nums">
                {summary.bargeRemainingMt > 0
                  ? `Sisa muatan tongkang: ${formatNumberId(summary.bargeRemainingMt, 2)} MT`
                  : summary.bargeRemainingMt < 0
                    ? `Melebihi target tongkang: ${formatNumberId(Math.abs(summary.bargeRemainingMt), 2)} MT`
                    : `Sesuai total 1 tongkang (${formatHoursToHm(summary.bargeOptimalHours)})`}
              </p>
            </div>
          )}
        </dl>

        {/* Optional Jetty Cap */}
        <div className="border-t border-slate-100 pt-3">
          <label className="flex cursor-pointer items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600">
              Batasi Laju Maksimal Jetty
            </span>
            <input
              type="checkbox"
              checked={config.useJettyCap}
              onChange={(e) =>
                onUpdateConfig({ useJettyCap: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
            />
          </label>

          {config.useJettyCap && (
            <div className="mt-2.5">
              <label
                htmlFor="jetty-cap-input"
                className="block text-[11px] text-slate-500"
              >
                Maksimal Jetty (DT / Jam)
              </label>
              <input
                id="jetty-cap-input"
                type="number"
                min="1"
                step="1"
                value={config.maxJettyRateDtPerHour || ''}
                onChange={(e) =>
                  onUpdateConfig({
                    maxJettyRateDtPerHour:
                      e.target.value === '' ? 0 : Number(e.target.value),
                  })
                }
                className="font-mono-tabular mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-sky-600 focus:bg-white focus:outline-none"
              />
            </div>
          )}
        </div>

        {summary.isJettyBottlenecked && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
            Laju operasi dibatasi oleh kapasitas jetty ({config.maxJettyRateDtPerHour} DT/jam).
          </p>
        )}
      </div>
    </aside>
  );
}
