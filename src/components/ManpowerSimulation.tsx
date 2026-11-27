import { CheckCircle2 } from 'lucide-react';
import {
  calculateLotPlan,
  formatHoursToHm,
  formatNumberId,
  type LotPlanSummary,
  type PlanConfig,
  type SublotInput,
} from '../utils/productivity';

interface ManpowerSimulationProps {
  config: PlanConfig;
  sublots: SublotInput[];
  summary: LotPlanSummary;
  onApplyManpower: (manpower: number) => void;
}

export function ManpowerSimulation({
  config,
  sublots,
  summary,
  onApplyManpower,
}: ManpowerSimulationProps) {
  if (!summary.hasValidSublots) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="font-display text-base font-bold text-slate-900">
          Simulasi Manpower Belum Tersedia
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Masukkan minimal satu sublot dengan Quantity dan Truck Factor valid pada tab Kalkulator Lot terlebih dahulu.
        </p>
      </div>
    );
  }

  const recMp = Math.max(1, summary.recommendedManpowerTotal);
  const maxMp = Math.max(recMp + 4, config.plannedManpower + 2, 6);
  const startMp = Math.max(1, recMp - 4);
  const candidates: number[] = [];
  for (let mp = startMp; mp <= maxMp; mp += 1) {
    candidates.push(mp);
  }
  if (!candidates.includes(config.plannedManpower) && config.plannedManpower > 0) {
    candidates.push(config.plannedManpower);
    candidates.sort((a, b) => a - b);
  }

  const rows = candidates.map((mp) => {
    const simSummary = calculateLotPlan(sublots, {
      ...config,
      plannedManpower: mp,
    });
    return { mp, simSummary };
  });

  const maxHours = Math.max(
    ...rows.map((r) => r.simSummary.estimatedHoursActual),
    1
  );

  return (
    <section
      aria-label="Simulasi Variasi Manpower"
      className="rounded-xl border border-slate-200 bg-white"
    >
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Simulasi Sensitivitas Jumlah Manpower
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Bandingkan pengaruh jumlah personel terhadap durasi penyelesaian dan Plan Productivity untuk{' '}
              <span className="font-semibold text-slate-700">
                {formatNumberId(summary.totalQuantityMt, 2)} MT (
                {formatNumberId(summary.totalIncrementsExact, 2)} Increment)
              </span>
            </p>
          </div>

          <div className="text-xs text-slate-600 tabular-nums">
            Standar optimal:{' '}
            <span className="font-mono-tabular font-bold text-sky-700">
              {recMp} Personel ({formatHoursToHm(summary.optimalHours)})
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
              <th className="py-3 pl-5 pr-3">Manpower</th>
              <th className="px-3 py-3 text-right">Beban / Personel</th>
              <th className="px-3 py-3 text-right">Estimasi Waktu</th>
              <th className="px-3 py-3">Visual Durasi</th>
              <th className="px-3 py-3 text-right">Productivity (MT/Jam)</th>
              <th className="px-3 py-3 text-right">Inc / Jam</th>
              <th className="px-3 py-3">Status</th>
              <th className="py-3 pl-3 pr-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ mp, simSummary }) => {
              const isOptimal = mp === recMp;
              const isCurrent = mp === config.plannedManpower;
              const widthPct = Math.min(
                100,
                Math.max(6, (simSummary.estimatedHoursActual / maxHours) * 100)
              );

              let statusText = 'Optimal';
              let statusClass = 'text-emerald-700';
              if (mp < recMp) {
                statusText = 'Overload / Lambat';
                statusClass = 'text-amber-700';
              } else if (mp > recMp) {
                statusText = 'Berlebih / Idle';
                statusClass = 'text-sky-700';
              }

              return (
                <tr
                  key={mp}
                  className={`transition-colors hover:bg-slate-50/70 ${
                    isOptimal ? 'bg-sky-50/40' : ''
                  }`}
                >
                  <td className="py-3 pl-5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular text-xs font-bold text-slate-900">
                        {mp} Personel
                      </span>
                      {isOptimal && (
                        <span className="text-[11px] font-semibold text-sky-700">
                          · Rekomendasi
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="font-mono-tabular px-3 py-3 text-right text-xs text-slate-700">
                    {formatNumberId(simSummary.workloadPerPersonInc, 1)} Inc
                  </td>
                  <td className="font-mono-tabular px-3 py-3 text-right text-xs font-semibold text-slate-900">
                    {formatHoursToHm(simSummary.estimatedHoursActual)}
                    <div className="text-[11px] font-normal text-slate-500">
                      {formatNumberId(simSummary.estimatedShiftsActual, 2)} Shift
                    </div>
                  </td>
                  <td className="px-3 py-3 w-40">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          isOptimal
                            ? 'bg-sky-600'
                            : mp < recMp
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </td>
                  <td className="font-mono-tabular px-3 py-3 text-right text-xs font-semibold text-slate-900">
                    {formatNumberId(simSummary.planProductivityMtPerHour, 1)}
                  </td>
                  <td className="font-mono-tabular px-3 py-3 text-right text-xs text-slate-700">
                    {formatNumberId(simSummary.planProductivityIncPerHour, 2)}
                  </td>
                  <td className={`px-3 py-3 text-xs font-semibold ${statusClass}`}>
                    {statusText}
                  </td>
                  <td className="py-3 pl-3 pr-5 text-right">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Aktif
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onApplyManpower(mp)}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:border-sky-600 hover:text-sky-700 whitespace-nowrap"
                      >
                        Terapkan
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
