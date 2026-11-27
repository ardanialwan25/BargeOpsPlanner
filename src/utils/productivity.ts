export type ScopeOfWork = 'loading_barge' | 'unloading_barge';

export type SublotMode = 'standard_100' | 'manual';

export interface SublotInput {
  id: string;
  name: string;
  quantityMt: number;
  truckFactor: number;
  mode?: SublotMode;
}

export interface SublotCalculation {
  id: string;
  name: string;
  quantityMt: number;
  truckFactor: number;
  isValid: boolean;
  error?: string;
  dumpTrucksExact: number;
  dumpTrucksRounded: number;
  incrementsExact: number;
  incrementsRounded: number;
  sublotEquivalent: number;
  fillPercentOfStandard: number;
  recommendedManpower: number;
}

export interface PlanConfig {
  scope: ScopeOfWork;
  lotName: string;
  bargeName: string;
  bargeTotalQuantityMt?: number;
  defaultTruckFactor?: number;
  plannedManpower: number;
  shiftHours: number;
  incrementsPerSublot: number;
  incrementsPerPerson: number;
  useJettyCap: boolean;
  maxJettyRateDtPerHour: number;
}

export type ManpowerStatus = 'optimal' | 'understaffed' | 'overstaffed' | 'invalid';

export interface LotPlanSummary {
  sublots: SublotCalculation[];
  hasValidSublots: boolean;
  hasInvalidSublots: boolean;
  configError?: string;
  totalQuantityMt: number;
  totalDumpTrucksExact: number;
  totalDumpTrucksRounded: number;
  totalIncrementsExact: number;
  totalIncrementsRounded: number;
  standardSublotEquivalent: number;
  recommendedManpowerTotal: number;
  recommendedManpowerPerStandardSublot: number;
  manpowerDelta: number;
  manpowerStatus: ManpowerStatus;
  workloadPerPersonInc: number;
  utilizationPercent: number;
  personRateIncPerHour: number;
  actualTeamRateIncPerHour: number;
  optimalTeamRateIncPerHour: number;
  estimatedHoursActual: number;
  estimatedShiftsActual: number;
  optimalHours: number;
  optimalShifts: number;
  isJettyBottlenecked: boolean;
  planProductivityMtPerHour: number;
  planProductivityIncPerHour: number;
  planProductivityMtPerPerson: number;
  optimalProductivityMtPerHour: number;
  optimalProductivityIncPerHour: number;
  bargeTotalQuantityMt: number;
  bargeFillPercent: number;
  bargeRemainingMt: number;
  bargeProjectedIncrements: number;
  bargeRecommendedManpower: number;
  bargeOptimalHours: number;
}

export const DEFAULT_INCREMENTS_PER_SUBLOT = 100;
export const DEFAULT_INCREMENTS_PER_PERSON = 50;
export const DEFAULT_SHIFT_HOURS = 8;

export function calculateSublot(
  input: SublotInput,
  incrementsPerSublot = DEFAULT_INCREMENTS_PER_SUBLOT,
  incrementsPerPerson = DEFAULT_INCREMENTS_PER_PERSON
): SublotCalculation {
  const qty = Number(input.quantityMt);
  const tf = Number(input.truckFactor);

  if (!Number.isFinite(qty) || qty <= 0) {
    return {
      id: input.id,
      name: input.name,
      quantityMt: Number.isFinite(qty) ? qty : 0,
      truckFactor: Number.isFinite(tf) ? tf : 0,
      isValid: false,
      error: 'Quantity (MT) harus lebih dari 0',
      dumpTrucksExact: 0,
      dumpTrucksRounded: 0,
      incrementsExact: 0,
      incrementsRounded: 0,
      sublotEquivalent: 0,
      fillPercentOfStandard: 0,
      recommendedManpower: 0,
    };
  }

  if (!Number.isFinite(tf) || tf <= 0) {
    return {
      id: input.id,
      name: input.name,
      quantityMt: qty,
      truckFactor: Number.isFinite(tf) ? tf : 0,
      isValid: false,
      error: 'Truck Factor harus lebih dari 0',
      dumpTrucksExact: 0,
      dumpTrucksRounded: 0,
      incrementsExact: 0,
      incrementsRounded: 0,
      sublotEquivalent: 0,
      fillPercentOfStandard: 0,
      recommendedManpower: 0,
    };
  }

  const dumpTrucksExact = qty / tf;
  const dumpTrucksRounded = Math.ceil(dumpTrucksExact - 1e-9);
  const incrementsExact = dumpTrucksExact;
  const incrementsRounded = dumpTrucksRounded;
  const sublotEquivalent = incrementsExact / incrementsPerSublot;
  const fillPercentOfStandard = sublotEquivalent * 100;
  const recommendedManpower = Math.ceil(incrementsExact / incrementsPerPerson - 1e-9);

  return {
    id: input.id,
    name: input.name,
    quantityMt: qty,
    truckFactor: tf,
    isValid: true,
    dumpTrucksExact,
    dumpTrucksRounded,
    incrementsExact,
    incrementsRounded,
    sublotEquivalent,
    fillPercentOfStandard,
    recommendedManpower,
  };
}

export function calculateLotPlan(
  sublotInputs: SublotInput[],
  config: PlanConfig
): LotPlanSummary {
  const incPerSublot =
    Number.isFinite(config.incrementsPerSublot) && config.incrementsPerSublot > 0
      ? config.incrementsPerSublot
      : DEFAULT_INCREMENTS_PER_SUBLOT;
  const incPerPerson =
    Number.isFinite(config.incrementsPerPerson) && config.incrementsPerPerson > 0
      ? config.incrementsPerPerson
      : DEFAULT_INCREMENTS_PER_PERSON;

  const sublots = sublotInputs.map((item) =>
    calculateSublot(item, incPerSublot, incPerPerson)
  );

  const validSublots = sublots.filter((s) => s.isValid);
  const hasValidSublots = validSublots.length > 0;
  const hasInvalidSublots = sublots.some((s) => !s.isValid);

  let configError: string | undefined;
  if (!Number.isFinite(config.plannedManpower) || config.plannedManpower <= 0) {
    configError = 'Jumlah manpower harus minimal 1 personel';
  } else if (!Number.isFinite(config.incrementsPerPerson) || config.incrementsPerPerson <= 0) {
    configError = 'Target increment per personel harus lebih dari 0';
  } else if (!Number.isFinite(config.shiftHours) || config.shiftHours <= 0) {
    configError = 'Durasi shift harus lebih dari 0 jam';
  } else if (config.useJettyCap && (!Number.isFinite(config.maxJettyRateDtPerHour) || config.maxJettyRateDtPerHour <= 0)) {
    configError = 'Batas kapasitas jetty harus lebih dari 0 DT/jam';
  }

  const totalQuantityMt = validSublots.reduce((sum, s) => sum + s.quantityMt, 0);
  const totalDumpTrucksExact = validSublots.reduce((sum, s) => sum + s.dumpTrucksExact, 0);
  const totalDumpTrucksRounded = validSublots.reduce((sum, s) => sum + s.dumpTrucksRounded, 0);
  const totalIncrementsExact = totalDumpTrucksExact;
  const totalIncrementsRounded = totalDumpTrucksRounded;
  const standardSublotEquivalent = totalIncrementsExact / incPerSublot;

  const recommendedManpowerTotal =
    totalIncrementsExact > 0
      ? Math.ceil(totalIncrementsExact / incPerPerson - 1e-9)
      : 0;
  const recommendedManpowerPerStandardSublot = Math.ceil(incPerSublot / incPerPerson - 1e-9);

  const bargeTotalQuantityMt =
    config.bargeTotalQuantityMt !== undefined &&
    Number.isFinite(config.bargeTotalQuantityMt) &&
    config.bargeTotalQuantityMt > 0
      ? config.bargeTotalQuantityMt
      : 0;

  if (configError || !hasValidSublots) {
    return {
      sublots,
      hasValidSublots,
      hasInvalidSublots,
      configError,
      totalQuantityMt,
      totalDumpTrucksExact,
      totalDumpTrucksRounded,
      totalIncrementsExact,
      totalIncrementsRounded,
      standardSublotEquivalent,
      recommendedManpowerTotal,
      recommendedManpowerPerStandardSublot,
      manpowerDelta: 0,
      manpowerStatus: 'invalid',
      workloadPerPersonInc: 0,
      utilizationPercent: 0,
      personRateIncPerHour: incPerPerson / (config.shiftHours > 0 ? config.shiftHours : DEFAULT_SHIFT_HOURS),
      actualTeamRateIncPerHour: 0,
      optimalTeamRateIncPerHour: 0,
      estimatedHoursActual: 0,
      estimatedShiftsActual: 0,
      optimalHours: 0,
      optimalShifts: 0,
      isJettyBottlenecked: false,
      planProductivityMtPerHour: 0,
      planProductivityIncPerHour: 0,
      planProductivityMtPerPerson: 0,
      optimalProductivityMtPerHour: 0,
      optimalProductivityIncPerHour: 0,
      bargeTotalQuantityMt,
      bargeFillPercent: bargeTotalQuantityMt > 0 ? (totalQuantityMt / bargeTotalQuantityMt) * 100 : 0,
      bargeRemainingMt: bargeTotalQuantityMt > 0 ? bargeTotalQuantityMt - totalQuantityMt : 0,
      bargeProjectedIncrements: 0,
      bargeRecommendedManpower: 0,
      bargeOptimalHours: 0,
    };
  }

  const plannedManpower = config.plannedManpower;
  const shiftHours = config.shiftHours;
  const personRateIncPerHour = incPerPerson / shiftHours;

  const rawActualTeamRate = plannedManpower * personRateIncPerHour;
  const rawOptimalTeamRate = recommendedManpowerTotal * personRateIncPerHour;

  const isJettyBottlenecked =
    config.useJettyCap &&
    config.maxJettyRateDtPerHour > 0 &&
    (rawActualTeamRate > config.maxJettyRateDtPerHour || rawOptimalTeamRate > config.maxJettyRateDtPerHour);

  const actualTeamRateIncPerHour = config.useJettyCap
    ? Math.min(rawActualTeamRate, config.maxJettyRateDtPerHour)
    : rawActualTeamRate;

  const optimalTeamRateIncPerHour = config.useJettyCap
    ? Math.min(rawOptimalTeamRate, config.maxJettyRateDtPerHour)
    : rawOptimalTeamRate;

  const estimatedHoursActual = totalIncrementsExact / actualTeamRateIncPerHour;
  const estimatedShiftsActual = estimatedHoursActual / shiftHours;

  const optimalHours =
    optimalTeamRateIncPerHour > 0 ? totalIncrementsExact / optimalTeamRateIncPerHour : 0;
  const optimalShifts = optimalHours / shiftHours;

  const manpowerDelta = plannedManpower - recommendedManpowerTotal;
  let manpowerStatus: ManpowerStatus = 'optimal';
  if (manpowerDelta < 0) {
    manpowerStatus = 'understaffed';
  } else if (manpowerDelta > 0) {
    manpowerStatus = 'overstaffed';
  }

  const workloadPerPersonInc = totalIncrementsExact / plannedManpower;
  const utilizationPercent = (totalIncrementsExact / (plannedManpower * incPerPerson)) * 100;

  const planProductivityMtPerHour = totalQuantityMt / estimatedHoursActual;
  const planProductivityIncPerHour = totalIncrementsExact / estimatedHoursActual;
  const planProductivityMtPerPerson = totalQuantityMt / plannedManpower;

  const optimalProductivityMtPerHour = optimalHours > 0 ? totalQuantityMt / optimalHours : 0;
  const optimalProductivityIncPerHour = optimalHours > 0 ? totalIncrementsExact / optimalHours : 0;

  const avgTruckFactor = totalIncrementsExact > 0 ? totalQuantityMt / totalIncrementsExact : 0;
  const bargeFillPercent = bargeTotalQuantityMt > 0 ? (totalQuantityMt / bargeTotalQuantityMt) * 100 : 0;
  const bargeRemainingMt = bargeTotalQuantityMt > 0 ? bargeTotalQuantityMt - totalQuantityMt : 0;
  const bargeProjectedIncrements =
    bargeTotalQuantityMt > 0 && avgTruckFactor > 0 ? bargeTotalQuantityMt / avgTruckFactor : 0;
  const bargeRecommendedManpower =
    bargeProjectedIncrements > 0 ? Math.ceil(bargeProjectedIncrements / incPerPerson - 1e-9) : 0;
  const bargeRawOptimalRate = bargeRecommendedManpower * personRateIncPerHour;
  const bargeEffectiveOptimalRate = config.useJettyCap
    ? Math.min(bargeRawOptimalRate, config.maxJettyRateDtPerHour)
    : bargeRawOptimalRate;
  const bargeOptimalHours =
    bargeEffectiveOptimalRate > 0 ? bargeProjectedIncrements / bargeEffectiveOptimalRate : 0;

  return {
    sublots,
    hasValidSublots,
    hasInvalidSublots,
    totalQuantityMt,
    totalDumpTrucksExact,
    totalDumpTrucksRounded,
    totalIncrementsExact,
    totalIncrementsRounded,
    standardSublotEquivalent,
    recommendedManpowerTotal,
    recommendedManpowerPerStandardSublot,
    manpowerDelta,
    manpowerStatus,
    workloadPerPersonInc,
    utilizationPercent,
    personRateIncPerHour,
    actualTeamRateIncPerHour,
    optimalTeamRateIncPerHour,
    estimatedHoursActual,
    estimatedShiftsActual,
    optimalHours,
    optimalShifts,
    isJettyBottlenecked,
    planProductivityMtPerHour,
    planProductivityIncPerHour,
    planProductivityMtPerPerson,
    optimalProductivityMtPerHour,
    optimalProductivityIncPerHour,
    bargeTotalQuantityMt,
    bargeFillPercent,
    bargeRemainingMt,
    bargeProjectedIncrements,
    bargeRecommendedManpower,
    bargeOptimalHours,
  };
}

export function generateSublotsFromTotal(
  totalQuantityMt: number,
  truckFactor: number,
  incrementsPerSublot = DEFAULT_INCREMENTS_PER_SUBLOT
): SublotInput[] {
  if (!Number.isFinite(totalQuantityMt) || totalQuantityMt <= 0) return [];
  if (!Number.isFinite(truckFactor) || truckFactor <= 0) return [];
  if (!Number.isFinite(incrementsPerSublot) || incrementsPerSublot <= 0) return [];

  const maxQtyPerSublot = truckFactor * incrementsPerSublot;
  const results: SublotInput[] = [];
  let remainingMt = totalQuantityMt;
  let index = 1;

  while (remainingMt > 1e-6) {
    const chunkMt = Math.min(remainingMt, maxQtyPerSublot);
    results.push({
      id: `sublot-${index}-${Math.round(chunkMt * 100)}`,
      name: `Sublot ${String(index).padStart(2, '0')}`,
      quantityMt: Number(chunkMt.toFixed(2)),
      truckFactor,
      mode: 'manual',
    });
    remainingMt -= chunkMt;
    index += 1;
    if (index > 200) break;
  }

  return results;
}

export function applySublotPatch(
  sublot: SublotInput,
  patch: Partial<SublotInput> & { directIncrements?: number },
  incrementsPerSublot = DEFAULT_INCREMENTS_PER_SUBLOT
): SublotInput {
  const nextMode: SublotMode = patch.mode ?? sublot.mode ?? 'manual';
  const nextTf = patch.truckFactor !== undefined ? patch.truckFactor : sublot.truckFactor;

  if (patch.directIncrements !== undefined) {
    const inc = Number.isFinite(patch.directIncrements) ? Math.max(0, patch.directIncrements) : 0;
    const validTf = Number.isFinite(nextTf) && nextTf > 0 ? nextTf : 0;
    return {
      ...sublot,
      name: patch.name ?? sublot.name,
      truckFactor: nextTf,
      mode: 'manual',
      quantityMt: Number((inc * validTf).toFixed(2)),
    };
  }

  if (nextMode === 'standard_100') {
    const validTf = Number.isFinite(nextTf) && nextTf > 0 ? nextTf : 0;
    return {
      ...sublot,
      ...patch,
      mode: 'standard_100',
      truckFactor: nextTf,
      quantityMt: Number((validTf * incrementsPerSublot).toFixed(2)),
    };
  }

  return {
    ...sublot,
    ...patch,
    mode: 'manual',
  };
}

export function formatHoursToHm(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0 jam 0 menit';
  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (wholeHours === 0) return `${mins} menit`;
  if (mins === 0) return `${wholeHours} jam`;
  return `${wholeHours} jam ${mins} menit`;
}

export function formatNumberId(value: number, maxDecimals = 2): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

export function buildCsvReport(config: PlanConfig, summary: LotPlanSummary): string {
  const scopeLabel = config.scope === 'loading_barge' ? 'Loading Barge' : 'Unloading Barge';
  const lines: string[] = [
    `BargeOps Planner - Laporan Plan Productivity`,
    `Scope of Work,${scopeLabel}`,
    `Nama Lot,${escapeCsv(config.lotName)}`,
    `Nama Barge,${escapeCsv(config.bargeName)}`,
    `Quantity Total 1 Tongkang (MT),${summary.bargeTotalQuantityMt > 0 ? summary.bargeTotalQuantityMt.toFixed(2) : '-'}`,
    `Manpower Terencana,${config.plannedManpower}`,
    `Rekomendasi Manpower (${config.incrementsPerPerson} inc/personel),${summary.recommendedManpowerTotal}`,
    `Durasi Shift (Jam),${config.shiftHours}`,
    `Waktu Estimasi Aktual (Jam),${summary.estimatedHoursActual.toFixed(2)}`,
    `Waktu Optimal (Jam),${summary.optimalHours.toFixed(2)}`,
    `Plan Productivity (MT/Jam),${summary.planProductivityMtPerHour.toFixed(2)}`,
    `Plan Productivity (Increment/Jam),${summary.planProductivityIncPerHour.toFixed(2)}`,
    '',
    'Sublot,Quantity (MT),Truck Factor (MT/DT),Jumlah Dump Truck,Jumlah Increment,Rekomendasi Manpower Sublot',
  ];

  for (const s of summary.sublots) {
    lines.push(
      [
        escapeCsv(s.name),
        s.quantityMt.toFixed(2),
        s.truckFactor.toFixed(2),
        s.dumpTrucksExact.toFixed(2),
        s.incrementsExact.toFixed(2),
        s.recommendedManpower.toString(),
      ].join(',')
    );
  }

  lines.push(
    [
      'TOTAL LOT',
      summary.totalQuantityMt.toFixed(2),
      '-',
      summary.totalDumpTrucksExact.toFixed(2),
      summary.totalIncrementsExact.toFixed(2),
      summary.recommendedManpowerTotal.toString(),
    ].join(',')
  );

  return lines.join('\n');
}

function escapeCsv(val: string): string {
  if (/[",\n]/.test(val)) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
