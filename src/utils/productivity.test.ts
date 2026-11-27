import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applySublotPatch,
  calculateSublot,
  calculateLotPlan,
  generateSublotsFromTotal,
  formatHoursToHm,
  buildCsvReport,
  type PlanConfig,
  type SublotInput,
} from './productivity';

const baseConfig: PlanConfig = {
  scope: 'loading_barge',
  lotName: 'Lot 01 - Kalimantan Thermal',
  bargeName: 'BG. Nusantara 3001',
  plannedManpower: 4,
  shiftHours: 8,
  incrementsPerSublot: 100,
  incrementsPerPerson: 50,
  useJettyCap: false,
  maxJettyRateDtPerHour: 30,
};

test('calculateSublot computes qty / truckFactor = dump trucks = increments and sublot equivalent', () => {
  const res = calculateSublot({
    id: 's1',
    name: 'Sublot 01',
    quantityMt: 2500,
    truckFactor: 25,
  });

  assert.equal(res.isValid, true);
  assert.equal(res.dumpTrucksExact, 100);
  assert.equal(res.dumpTrucksRounded, 100);
  assert.equal(res.incrementsExact, 100);
  assert.equal(res.sublotEquivalent, 1);
  assert.equal(res.recommendedManpower, 2);
});

test('calculateSublot handles invalid inputs safely without NaN', () => {
  const zeroTf = calculateSublot({
    id: 's1',
    name: 'Sublot 01',
    quantityMt: 2500,
    truckFactor: 0,
  });
  assert.equal(zeroTf.isValid, false);
  assert.equal(zeroTf.incrementsExact, 0);

  const zeroQty = calculateSublot({
    id: 's2',
    name: 'Sublot 02',
    quantityMt: 0,
    truckFactor: 25,
  });
  assert.equal(zeroQty.isValid, false);
});

test('calculateLotPlan sums sublots directly and computes optimal time & recommended manpower', () => {
  const sublots: SublotInput[] = [
    { id: '1', name: 'Sublot 01', quantityMt: 2500, truckFactor: 25 }, // 100 inc
    { id: '2', name: 'Sublot 02', quantityMt: 2500, truckFactor: 25 }, // 100 inc
  ];

  const plan = calculateLotPlan(sublots, baseConfig);

  assert.equal(plan.totalQuantityMt, 5000);
  assert.equal(plan.totalDumpTrucksExact, 200);
  assert.equal(plan.totalIncrementsExact, 200);
  assert.equal(plan.standardSublotEquivalent, 2);
  assert.equal(plan.recommendedManpowerTotal, 4);
  assert.equal(plan.manpowerStatus, 'optimal');
  assert.equal(plan.estimatedHoursActual, 8);
  assert.equal(plan.optimalHours, 8);
  assert.equal(plan.planProductivityMtPerHour, 625);
  assert.equal(plan.planProductivityIncPerHour, 25);
  assert.equal(plan.planProductivityMtPerPerson, 1250);
  assert.equal(plan.utilizationPercent, 100);
});

test('calculateLotPlan detects understaffed and computes longer actual duration vs optimal time', () => {
  const sublots: SublotInput[] = [
    { id: '1', name: 'Sublot 01', quantityMt: 2500, truckFactor: 25 }, // 100 inc
    { id: '2', name: 'Sublot 02', quantityMt: 3000, truckFactor: 30 }, // 100 inc
    { id: '3', name: 'Sublot 03', quantityMt: 2000, truckFactor: 20 }, // 100 inc
  ];

  const plan = calculateLotPlan(sublots, {
    ...baseConfig,
    plannedManpower: 3,
  });

  assert.equal(plan.totalQuantityMt, 7500);
  assert.equal(plan.totalIncrementsExact, 300);
  assert.equal(plan.recommendedManpowerTotal, 6);
  assert.equal(plan.manpowerStatus, 'understaffed');
  assert.equal(plan.manpowerDelta, -3);
  assert.equal(plan.workloadPerPersonInc, 100);
  assert.equal(plan.utilizationPercent, 200);
  assert.equal(plan.estimatedHoursActual, 16);
  assert.equal(plan.optimalHours, 8);
});

test('calculateLotPlan respects jetty bottleneck when enabled', () => {
  const sublots: SublotInput[] = [
    { id: '1', name: 'Sublot 01', quantityMt: 2500, truckFactor: 25 },
    { id: '2', name: 'Sublot 02', quantityMt: 2500, truckFactor: 25 },
  ];

  const plan = calculateLotPlan(sublots, {
    ...baseConfig,
    plannedManpower: 4,
    useJettyCap: true,
    maxJettyRateDtPerHour: 20, // Cap below 25 DT/h
  });

  assert.equal(plan.isJettyBottlenecked, true);
  assert.equal(plan.optimalHours, 10);
  assert.equal(plan.optimalProductivityIncPerHour, 20);
  assert.equal(plan.optimalProductivityMtPerHour, 500);
});

test('generateSublotsFromTotal splits total quantity into sublots by truck factor and increments per sublot', () => {
  const generated = generateSublotsFromTotal(6250, 25, 100);
  assert.equal(generated.length, 3);
  assert.equal(generated[0].quantityMt, 2500);
  assert.equal(generated[1].quantityMt, 2500);
  assert.equal(generated[2].quantityMt, 1250);

  const customChunk = generateSublotsFromTotal(8500, 25, 80);
  assert.equal(customChunk.length, 5);
  assert.equal(customChunk[0].quantityMt, 2000);
  assert.equal(customChunk[4].quantityMt, 500);

  assert.deepEqual(generateSublotsFromTotal(5000, 25, 0), []);
});

test('applySublotPatch syncs quantity when standard_100 and supports manual increment input', () => {
  const base: SublotInput = {
    id: '1',
    name: 'Sublot 01',
    quantityMt: 2500,
    truckFactor: 25,
    mode: 'standard_100',
  };

  const updatedTf = applySublotPatch(base, { truckFactor: 30 }, 100);
  assert.equal(updatedTf.quantityMt, 3000);
  assert.equal(updatedTf.mode, 'standard_100');

  const manualInc = applySublotPatch(updatedTf, { directIncrements: 60 }, 100);
  assert.equal(manualInc.mode, 'manual');
  assert.equal(manualInc.quantityMt, 1800);
});

test('calculateLotPlan supports manual incrementsPerSublot and incrementsPerPerson targets and validates > 0', () => {
  const sublots: SublotInput[] = [
    { id: '1', name: 'Sublot 01', quantityMt: 2000, truckFactor: 25, mode: 'standard_100' }, // 80 inc
    { id: '2', name: 'Sublot 02', quantityMt: 2000, truckFactor: 25, mode: 'standard_100' }, // 80 inc
  ];

  const customPlan = calculateLotPlan(sublots, {
    ...baseConfig,
    incrementsPerSublot: 80,
    incrementsPerPerson: 40,
    plannedManpower: 4,
  });

  assert.equal(customPlan.standardSublotEquivalent, 2);
  assert.equal(customPlan.recommendedManpowerTotal, 4); // 160 / 40
  assert.equal(customPlan.recommendedManpowerPerStandardSublot, 2); // 80 / 40
  assert.equal(customPlan.manpowerStatus, 'optimal');
  assert.equal(customPlan.optimalHours, 8);

  const invalidTarget = calculateLotPlan(sublots, {
    ...baseConfig,
    incrementsPerPerson: 0,
  });
  assert.equal(invalidTarget.manpowerStatus, 'invalid');
  assert.ok(invalidTarget.configError);
});

test('calculateLotPlan calculates barge fill progress and full-barge projection', () => {
  const sublots: SublotInput[] = [
    { id: '1', name: 'Sublot 01', quantityMt: 2500, truckFactor: 25 },
    { id: '2', name: 'Sublot 02', quantityMt: 2500, truckFactor: 25 },
  ];

  const plan = calculateLotPlan(sublots, {
    ...baseConfig,
    bargeTotalQuantityMt: 10000,
  });

  assert.equal(plan.bargeTotalQuantityMt, 10000);
  assert.equal(plan.bargeFillPercent, 50);
  assert.equal(plan.bargeRemainingMt, 5000);
  assert.equal(plan.bargeProjectedIncrements, 400);
  assert.equal(plan.bargeRecommendedManpower, 8);
  assert.equal(plan.bargeOptimalHours, 8);
});

test('formatHoursToHm formats fractional hours cleanly in Indonesian', () => {
  assert.equal(formatHoursToHm(8), '8 jam');
  assert.equal(formatHoursToHm(7.5), '7 jam 30 menit');
  assert.equal(formatHoursToHm(0.5), '30 menit');
});

test('buildCsvReport generates valid CSV containing summary and sublot rows', () => {
  const sublots: SublotInput[] = [
    { id: '1', name: 'Sublot 01', quantityMt: 2500, truckFactor: 25 },
  ];
  const plan = calculateLotPlan(sublots, baseConfig);
  const csv = buildCsvReport(baseConfig, plan);
  assert.ok(csv.includes('Loading Barge'));
  assert.ok(csv.includes('Sublot 01,2500.00,25.00,100.00,100.00,2'));
  assert.ok(csv.includes('TOTAL LOT,2500.00'));
});
