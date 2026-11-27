import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import {
  formatHoursToHm,
  formatNumberId,
  type LotPlanSummary,
  type PlanConfig,
} from '../utils/productivity';

interface KpiStripProps {
  config: PlanConfig;
  summary: LotPlanSummary;
}

export function KpiStrip({ config, summary }: KpiStripProps) {
  const isInvalid = !summary.hasValidSublots || Boolean(summary.configError);

  const statusMeta = (() => {
    switch (summary.manpowerStatus) {
      case 'optimal':
        return {
          label: 'Optimal (Sesuai Standar)',
          colorClass: 'text-emerald-300',
          Icon: CheckCircle2,
        };
      case 'understaffed':
        return {
          label: `Kurang ${Math.abs(summary.manpowerDelta)} Personel`,
          colorClass: 'text-amber-300',
          Icon: AlertTriangle,
        };
      case 'overstaffed':
        return {
          label: `Berlebih ${Math.abs(summary.manpowerDelta)} Personel`,
          colorClass: 'text-sky-300',
          Icon: Info,
        };
      default:
        return {
          label: 'Periksa Input',
          colorClass: 'text-rose-300',
          Icon: AlertTriangle,
        };
    }
  })();

  const StatusIcon = statusMeta.Icon;

  return (
    <section
      aria-label="Ringkasan Metrik Utama"
      className="grid grid-cols-1 gap-4 lg:grid-cols-12"
    >
      {/* Primary Highlight: Optimal Time & Manpower Recommendation */}
      <div className="rounded-xl bg-slate-900 p-6 text-white lg:col-span-5">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5">
          <div className="sm:border-r sm:border-slate-800 sm:pr-4">
            <p className="text-xs font-medium text-slate-300">
              Waktu Optimal Didapat
            </p>
            <div className="mt-2 font-mono-tabular text-2xl font-bold tracking-tight text-white xl:text-[25px] whitespace-nowrap">
              {isInvalid ? '—' : formatHoursToHm(summary.optimalHours)}
            </div>
            <p className="mt-2 text-xs text-slate-300 tabular-nums">
              Aktual: {isInvalid ? '—' : formatHoursToHm(summary.estimatedHoursActual)} ·{' '}
              {isInvalid ? '—' : `${formatNumberId(summary.optimalShifts, 2)} Shift`}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-300">
              Rekomendasi Manpower
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono-tabular text-2xl font-bold tracking-tight text-white sm:text-[28px]">
                {summary.hasValidSublots
                  ? `${summary.recommendedManpowerTotal} Org`
                  : '—'}
              </span>
              <span className="text-xs text-slate-400">
                (Aktual: {config.plannedManpower})
              </span>
            </div>
            <div
              className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${statusMeta.colorClass}`}
            >
              <StatusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{statusMeta.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Structural Metrics: Plan Productivity & Total Quantity/Increments */}
      <div className="grid grid-cols-1 gap-6 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2 lg:col-span-7">
        <div className="sm:border-r sm:border-slate-100 sm:pr-4">
          <p className="text-xs font-medium text-slate-500">Plan Productivity</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
              {isInvalid ? '—' : formatNumberId(summary.planProductivityMtPerHour, 1)}
            </span>
            <span className="text-xs font-medium text-slate-500">MT / Jam</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 tabular-nums">
            <span>
              {isInvalid
                ? '—'
                : `${formatNumberId(summary.planProductivityIncPerHour, 2)} Inc/Jam`}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {isInvalid
                ? '—'
                : `${formatNumberId(summary.planProductivityMtPerPerson, 1)} MT/Org`}
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">
            Total Lot & Increment
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold tracking-tight text-sky-700 sm:text-[28px]">
              {formatNumberId(summary.totalIncrementsExact, 2)}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Increment ({formatNumberId(summary.totalDumpTrucksRounded, 0)} DT)
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600 tabular-nums">
            <span>Lot: {formatNumberId(summary.totalQuantityMt, 2)} MT</span>
            <span aria-hidden="true">·</span>
            <span>{summary.sublots.length} Sublot</span>
            {summary.bargeTotalQuantityMt > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-800">
                  1 Tongkang: {formatNumberId(summary.bargeTotalQuantityMt, 2)} MT (
                  {formatNumberId(summary.bargeFillPercent, 0)}%)
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
