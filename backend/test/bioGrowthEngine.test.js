const test = require('node:test');
const assert = require('node:assert');
const { simulateGrowth, CROP_PARAM_DATABASE } = require('../services/matlabBioGrowthEngine');

test('Bio-Growth ODE Engine: Rice simulation produces valid moisture decay & GDD', () => {
  const sowDate = new Date();
  sowDate.setDate(sowDate.getDate() - 105);

  const res = simulateGrowth({
    crop: 'Rice',
    sowingDate: sowDate.toISOString().split('T')[0],
    avgTempC: 30.0,
    avgRelHumidity: 65.0,
  });

  assert.strictEqual(res.crop, 'Rice');
  assert.ok(res.accumulatedGDD > 1500, `GDD accumulated ${res.accumulatedGDD} should be > 1500`);
  assert.ok(res.maturityIndexPct >= 70, `Maturity ${res.maturityIndexPct}% should be >= 70%`);
  assert.ok(res.currentMoisturePct >= 10 && res.currentMoisturePct <= 35, `Current moisture ${res.currentMoisturePct}% out of bounds`);
  assert.ok(res.equilibriumMoisturePct >= 9 && res.equilibriumMoisturePct <= 20, `M_eq ${res.equilibriumMoisturePct}% out of bounds`);
  assert.strictEqual(res.dailyMoistureCurve.length, 15, 'Should produce 15 trajectory points (days 0-14)');
  assert.ok(res.optimalDayOffset >= 0 && res.optimalDayOffset <= 14, `Optimal day offset ${res.optimalDayOffset} should be within 0-14 days`);
  
  // Verify moisture decays monotonically or reaches equilibrium
  const m0 = res.dailyMoistureCurve[0].moisturePct;
  const m14 = res.dailyMoistureCurve[14].moisturePct;
  assert.ok(m14 <= m0, `Moisture on day 14 (${m14}) should be <= day 0 (${m0})`);
});

test('Bio-Growth ODE Engine: Wheat and Maize parameters calibration', () => {
  ['Wheat', 'Maize'].forEach(crop => {
    const sowDate = new Date();
    sowDate.setDate(sowDate.getDate() - 90);

    const res = simulateGrowth({
      crop,
      sowingDate: sowDate.toISOString().split('T')[0],
      avgTempC: 26.0,
      avgRelHumidity: 60.0,
    });

    assert.strictEqual(res.crop, crop);
    assert.ok(res.dailyMoistureCurve.length === 15);
    assert.ok(res.targetSafeMoisturePct > 10 && res.targetSafeMoisturePct < 20);
    assert.ok(res.dryingRateK > 0.05 && res.dryingRateK < 0.35);
  });
});
