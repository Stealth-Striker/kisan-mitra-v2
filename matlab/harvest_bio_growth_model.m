function results = harvest_bio_growth_model(cropName, sowingDateStr, currentTempC, currentRHPct)
% HARVEST_BIO_GROWTH_MODEL - Kisan Mitra Agronomic Growth & Moisture ODE Model
% Models daily thermal accumulation (Growing Degree Days) and continuous grain
% moisture drying kinetics using first-order differential equations.
%
% Usage:
%   results = harvest_bio_growth_model('Rice', '2026-06-01', 29.5, 68);

    if nargin < 1, cropName = 'Rice'; end
    if nargin < 2, sowingDateStr = datestr(now - 105, 'yyyy-mm-dd'); end
    if nargin < 3, currentTempC = 29.5; end
    if nargin < 4, currentRHPct = 68; end

    % Crop-specific biological parameters
    switch lower(cropName)
        case 'rice'
            T_base = 10.0;          % Base physiological temperature (°C)
            GDD_target = 1550.0;    % Cumulative thermal units to harvest maturity
            M_initial = 32.0;       % Grain moisture at early dough stage (%)
            M_target = 14.5;        % Safe harvest equilibrium moisture (%)
            k_dry_base = 0.045;     % Henderson dry-down coefficient (1/day)
        case 'wheat'
            T_base = 4.5;
            GDD_target = 1700.0;
            M_initial = 35.0;
            M_target = 13.0;
            k_dry_base = 0.052;
        case 'maize'
            T_base = 10.0;
            GDD_target = 1450.0;
            M_initial = 36.0;
            M_target = 15.5;
            k_dry_base = 0.038;
        otherwise % Default (Tomato / General)
            T_base = 10.0;
            GDD_target = 1100.0;
            M_initial = 85.0;
            M_target = 75.0;
            k_dry_base = 0.040;
    end

    % 1. Growing Degree Day (GDD) Calculation
    % GDD = sum(max(0, (T_max + T_min)/2 - T_base))
    T_max = currentTempC + 4.0;
    T_min = currentTempC - 4.5;
    daily_GDD = max(0, ((T_max + T_min) / 2.0) - T_base);

    sowingDate = datenum(sowingDateStr, 'yyyy-mm-dd');
    daysElapsed = max(1, round(now - sowingDate));
    gddAccumulated = min(GDD_target, round(daysElapsed * daily_GDD, 1));
    maturityPct = min(100.0, round((gddAccumulated / GDD_target) * 100.0, 1));

    % 2. Grain Moisture Differential Equation (Modified Henderson Kinetic Model)
    % dM/dt = -k(T, RH) * (M(t) - M_eq)
    % where M_eq is equilibrium moisture content based on atmospheric RH and T
    RH_fraction = currentRHPct / 100.0;
    M_eq = max(10.0, M_target * (1.0 - 0.25 * (1.0 - RH_fraction)));
    k_effective = k_dry_base * (1.0 + 0.03 * (currentTempC - 25.0)) * (1.0 - 0.3 * (RH_fraction - 0.5));

    % Numerical integration over crop ripening window (14 days trajectory)
    tspan = 0:14;
    ode_fun = @(t, M) -k_effective * (M - M_eq);
    [t_out, M_out] = ode45(ode_fun, tspan, M_initial);

    % Interpolate daily moisture curve
    daily_days = 0:14;
    daily_moisture = interp1(t_out, M_out, daily_days);

    % Find predicted optimal harvest day when moisture is within 1% of M_target
    optimal_idx = find(daily_moisture <= (M_target + 0.5), 1);
    if isempty(optimal_idx)
        daysToOptimal = 14;
    else
        daysToOptimal = daily_days(optimal_idx);
    end
    predictedHarvestDate = datestr(now + daysToOptimal, 'yyyy-mm-dd');

    % Return structured result object
    results = struct();
    results.crop = cropName;
    results.gddAccumulated = gddAccumulated;
    results.gddTarget = GDD_target;
    results.maturityPct = maturityPct;
    results.currentMoisture = round(daily_moisture(1), 1);
    results.targetMoisture = M_target;
    results.daysToOptimal = daysToOptimal;
    results.predictedHarvestDate = predictedHarvestDate;
    results.solver = 'ODE45 (Runge-Kutta 4th/5th order differential)';

    fprintf('====================================================\n');
    fprintf('  KISAN MITRA HARVEST BIO-GROWTH MODEL (MATLAB)\n');
    fprintf('====================================================\n');
    fprintf('Crop: %s | Days Elapsed: %d | GDD: %.1f / %.1f (%.1f%%)\n', cropName, daysElapsed, gddAccumulated, GDD_target, maturityPct);
    fprintf('Current Grain Moisture: %.1f%% -> Target: %.1f%%\n', results.currentMoisture, M_target);
    fprintf('Predicted Optimal Harvest: %s (in %d days)\n', predictedHarvestDate, daysToOptimal);
    fprintf('Differential Solver: %s\n', results.solver);
    fprintf('====================================================\n');
end
