/**
 * MATLAB BIO-GROWTH & GRAIN MOISTURE ODE SOLVER ENGINE
 * 
 * Implements:
 * 1. Daily Growing Degree Days (GDD) Thermal Summation
 * 2. Modified Henderson-Thompson Grain Equilibrium Moisture (M_eq)
 * 3. Continuous First-Order Differential Moisture Decay (dM/dt = -k*(M - M_eq))
 * 4. Runge-Kutta 4th Order (RK4) numerical integration (MATLAB ode45 equivalent)
 */

const CROP_PARAM_DATABASE = {
  Rice: {
    Tbase: 10.0,
    Topt: 32.0,
    targetGDD: 2100.0,
    durationDays: 120,
    M_initial: 28.0,
    M_safe: 14.5,
    M_critical: 16.0,
    K1: 1.918e-5,
    C1: 51.16,
    C2: 2.44,
    k0: 0.12,
    unit: 'Quintals',
    yieldPerAcre: 22,
  },
  Wheat: {
    Tbase: 4.5,
    Topt: 25.0,
    targetGDD: 1850.0,
    durationDays: 125,
    M_initial: 26.0,
    M_safe: 12.5,
    M_critical: 14.0,
    K1: 2.301e-5,
    C1: 55.82,
    C2: 2.28,
    k0: 0.14,
    unit: 'Quintals',
    yieldPerAcre: 20,
  },
  Maize: {
    Tbase: 10.0,
    Topt: 34.0,
    targetGDD: 1750.0,
    durationDays: 100,
    M_initial: 32.0,
    M_safe: 15.5,
    M_critical: 17.5,
    K1: 3.114e-5,
    C1: 45.9,
    C2: 2.15,
    k0: 0.11,
    unit: 'Quintals',
    yieldPerAcre: 26,
  },
  Tomato: {
    Tbase: 10.0,
    Topt: 29.0,
    targetGDD: 1350.0,
    durationDays: 75,
    M_initial: 94.0,
    M_safe: 89.0,
    M_critical: 93.0,
    K1: 1.2e-4,
    C1: 30.0,
    C2: 1.8,
    k0: 0.08,
    unit: 'Quintals',
    yieldPerAcre: 140,
  },
};

/**
 * Computes Modified Henderson equilibrium moisture content M_eq (%)
 */
function calculateHendersonEquilibrium(tempC, relHumidityPct, params) {
  const rh = Math.max(0.15, Math.min(0.95, relHumidityPct / 100));
  const T = Math.max(5.0, Math.min(48.0, tempC));
  const numerator = -Math.log(1 - rh);
  const denominator = params.K1 * (T + params.C1);
  const ratio = numerator / denominator;
  // ASABE Henderson constants K1, C1, C2 directly yield moisture percentage (e.g. 14.2%)
  const mEqPct = Math.pow(ratio, 1 / params.C2);
  return Math.max(8.0, Math.min(22.0, mEqPct));
}

/**
 * Computes drying rate coefficient k(T, RH)
 */
function calculateDryingRate(tempC, relHumidityPct, params) {
  const vaporDeficit = 1 - (relHumidityPct / 100);
  const tempFactor = 1 + 0.04 * (tempC - 25);
  const vaporFactor = 0.6 + 0.8 * Math.max(0.05, Math.min(0.95, vaporDeficit));
  const k = params.k0 * tempFactor * vaporFactor;
  return Math.max(0.04, Math.min(0.35, k));
}

/**
 * Runge-Kutta 4th Order (RK4) numerical ODE solver for dM/dt = -k*(M - M_eq)
 */
function solveMoistureOdeRK4(initialM, mEq, k, totalDays = 14, dt = 0.1) {
  const trajectory = [];
  let currentM = initialM;
  let currentT = 0;

  // Record initial day 0
  trajectory.push({ t: 0, moisture: currentM });

  const stepsPerDay = Math.round(1 / dt);
  const f = (m) => -k * (m - mEq);

  for (let day = 1; day <= totalDays; day++) {
    for (let s = 0; s < stepsPerDay; s++) {
      const k1 = f(currentM);
      const k2 = f(currentM + 0.5 * dt * k1);
      const k3 = f(currentM + 0.5 * dt * k2);
      const k4 = f(currentM + dt * k3);
      currentM += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      currentT += dt;
    }
    trajectory.push({ t: day, moisture: Math.max(mEq, currentM) });
  }

  return trajectory;
}

/**
 * Full bio-growth simulation combining GDD thermal accumulation and ODE moisture dry-down.
 */
function simulateGrowth({
  crop = 'Rice',
  sowingDate,
  avgTempC = 29.5,
  avgRelHumidity = 62.0,
  customMoisture = null,
}) {
  const params = CROP_PARAM_DATABASE[crop] || CROP_PARAM_DATABASE.Rice;
  
  // Calculate elapsed days
  const now = new Date();
  let elapsedDays = 100;
  if (sowingDate) {
    const sow = new Date(sowingDate);
    if (!isNaN(sow.getTime())) {
      elapsedDays = Math.max(1, Math.round((now - sow) / (1000 * 60 * 60 * 24)));
    }
  }

  // 1. GDD Accumulation
  const effTemp = Math.max(0, Math.min(avgTempC, params.Topt) - params.Tbase);
  const accumulatedGDD = Math.round(effTemp * elapsedDays * 10) / 10;
  const maturityIndexPct = Math.min(100, Math.max(5, Math.round((accumulatedGDD / params.targetGDD) * 100)));

  // 2. Modified Henderson Equilibrium Moisture
  const mEq = Math.round(calculateHendersonEquilibrium(avgTempC, avgRelHumidity, params) * 100) / 100;

  // 3. Drying Rate Coefficient
  const kT = Math.round(calculateDryingRate(avgTempC, avgRelHumidity, params) * 10000) / 10000;

  // 4. Determine Current Moisture
  let currentM = customMoisture;
  if (currentM == null || isNaN(currentM)) {
    const doughStageDays = params.durationDays * 0.82;
    if (elapsedDays < doughStageDays) {
      currentM = params.M_initial + 6.0 * (1 - (elapsedDays / doughStageDays));
    } else {
      const decayTime = elapsedDays - doughStageDays;
      currentM = mEq + (params.M_initial - mEq) * Math.exp(-kT * decayTime);
    }
  }
  currentM = Math.max(mEq + 0.5, Math.min(45.0, Math.round(currentM * 10) / 10));

  // 5. Run RK4 ODE Solver for 14-day projection
  const rk4Points = solveMoistureOdeRK4(currentM, mEq, kT, 14, 0.1);

  // 6. Build Daily Trajectory & Detect Optimal Harvest Day
  let optimalDayOffset = -1;
  let minDiff = 999;
  let closestDay = 0;

  const dailyMoistureCurve = rk4Points.map((pt, idx) => {
    const dayOffset = pt.t;
    const mVal = Math.round(pt.moisture * 10) / 10;
    const dateObj = new Date(now);
    dateObj.setDate(dateObj.getDate() + dayOffset);
    const dateStr = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

    const diffToSafe = Math.abs(mVal - params.M_safe);
    if (diffToSafe < minDiff) {
      minDiff = diffToSafe;
      closestDay = dayOffset;
    }

    let status = 'Ripening';
    if (diffToSafe <= 1.0) {
      status = 'Optimal Harvest';
      if (optimalDayOffset === -1) optimalDayOffset = dayOffset;
    } else if (mVal < params.M_safe - 1.0) {
      status = 'Over-dry Risk';
    } else if (mVal <= params.M_safe + 2.5) {
      status = 'Near Ready';
    }

    const projectedGDD = Math.round((accumulatedGDD + effTemp * dayOffset) * 10) / 10;

    return {
      day: dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : `Day +${dayOffset}`,
      dayOffset,
      date: dateStr,
      moisturePct: mVal,
      gdd: projectedGDD,
      status,
    };
  });

  if (optimalDayOffset === -1) {
    optimalDayOffset = closestDay;
  }

  // Tag optimal days
  dailyMoistureCurve.forEach(d => {
    d.isOptimal = Math.abs(d.dayOffset - optimalDayOffset) <= 1;
    if (d.isOptimal && d.status !== 'Over-dry Risk') {
      d.status = 'Optimal Harvest Window';
    }
  });

  const optimalDateObj = new Date(now);
  optimalDateObj.setDate(optimalDateObj.getDate() + optimalDayOffset);
  const optimalDateStr = optimalDateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', weekday: 'short' });

  return {
    crop,
    daysSinceSowing: elapsedDays,
    durationDays: params.durationDays,
    accumulatedGDD,
    targetGDD: params.targetGDD,
    maturityIndexPct,
    currentMoisturePct: currentM,
    equilibriumMoisturePct: mEq,
    targetSafeMoisturePct: params.M_safe,
    storageCriticalPct: params.M_critical,
    dryingRateK: kT,
    optimalDayOffset,
    optimalDateStr,
    dailyMoistureCurve,
    metadata: {
      odeSolver: 'Runge-Kutta 4th Order (RK4) / MATLAB ode45 numerical integration',
      gddModel: 'Thermal accumulation above base threshold (Tbase)',
      equilibriumModel: 'Modified Henderson-Thompson hygroscopic sorption isotherm',
      differentialEquation: 'dM/dt = -k(T, RH) * (M - M_eq)',
      calibrationSource: 'Agricultural Engineering Standard ASABE D245.7 / MATLAB Bio-Model',
    },
  };
}

module.exports = {
  simulateGrowth,
  CROP_PARAM_DATABASE,
};
