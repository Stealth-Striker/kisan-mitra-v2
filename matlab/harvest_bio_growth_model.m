%% HARVEST GUARDIAN - MATLAB BIO-GROWTH & GRAIN MOISTURE DECAY MODEL
% Dynamic Differential Equation Model for Crop Physiological Maturity
% and Optimal Harvest Window Prediction.
%
% Kisan Mitra Agronomic Modeling Suite
% Models:
%   1. Daily Growing Degree Days (GDD) Thermal Accumulation
%   2. Modified Henderson-Thompson Grain Equilibrium Moisture (M_eq)
%   3. First-Order Grain Drying Differential Equation (dM/dt)
%
% Usage:
%   matlab -batch "harvest_bio_growth_model"
%   or in MATLAB console:
%   [results] = harvest_bio_growth_model('Rice', 105, 30.5, 65.0);

function results = harvest_bio_growth_model(cropName, daysSinceSowing, avgTempC, avgRelHumidity)
    if nargin < 1, cropName = 'Rice'; end
    if nargin < 2, daysSinceSowing = 105; end
    if nargin < 3, avgTempC = 29.5; end
    if nargin < 4, avgRelHumidity = 65.0; end

    fprintf('=======================================================\n');
    fprintf('   HARVEST GUARDIAN: MATLAB BIO-GROWTH ODE ENGINE     \n');
    fprintf('   Crop: %s | Days: %d | Temp: %.1f C | RH: %.1f%%\n', ...
        cropName, daysSinceSowing, avgTempC, avgRelHumidity);
    fprintf('=======================================================\n\n');

    % -------------------------------------------------------------
    % 1. Crop Agronomic Calibration Parameters
    % -------------------------------------------------------------
    cropParams = getCropParameters(cropName);

    Tbase        = cropParams.Tbase;        % Base temperature (deg C)
    Topt         = cropParams.Topt;         % Optimum temperature (deg C)
    targetGDD    = cropParams.targetGDD;    % GDD required for maturity
    durationDays = cropParams.durationDays; % Typical cycle duration (days)
    M_initial    = cropParams.M_initial;    % Moisture at physiological maturity (%)
    M_safe       = cropParams.M_safe;       % Optimal safe harvest moisture (%)
    M_critical   = cropParams.M_critical;   % Storage spoil threshold (%)
    K1           = cropParams.K1;           % Henderson Constant 1
    C1           = cropParams.C1;           % Henderson Temperature Offset
    C2           = cropParams.C2;           % Henderson Power Exponent
    k0           = cropParams.k0;           % Base drying coefficient (1/day)

    % -------------------------------------------------------------
    % 2. Growing Degree Days (GDD) Accumulation
    % GDD = sum( max(0, min(Tavg, Topt) - Tbase) )
    % -------------------------------------------------------------
    effTemp = max(0, min(avgTempC, Topt) - Tbase);
    accumulatedGDD = effTemp * daysSinceSowing;
    maturityIndexPct = min(100, (accumulatedGDD / targetGDD) * 100);

    % -------------------------------------------------------------
    % 3. Modified Henderson Grain Equilibrium Moisture Content (M_eq)
    % M_eq = ( -ln(1 - RH/100) / (K1 * (T + C1)) ) ^ (1 / C2)
    % -------------------------------------------------------------
    rhFraction = max(0.15, min(0.95, avgRelHumidity / 100));
    % Henderson constants calibrated for M_eq directly in percentage (%)
    M_eq = ( -log(1 - rhFraction) / (K1 * (avgTempC + C1)) ) ^ (1 / C2);
    M_eq = max(8.5, min(22.0, M_eq));

    % -------------------------------------------------------------
    % 4. Drying Rate Coefficient k(T, RH)
    % Arrhenius-type thermal dependence adjusted by vapor deficit
    % -------------------------------------------------------------
    vaporDeficit = 1 - (avgRelHumidity / 100);
    kT = k0 * (1 + 0.04 * (avgTempC - 25)) * (0.6 + 0.8 * vaporDeficit);
    kT = max(0.04, min(0.35, kT));

    % -------------------------------------------------------------
    % 5. Continuous Grain Moisture ODE Integration
    % Differential Equation: dM/dt = -kT * (M(t) - M_eq)
    % Solved over a 14-day projection window [t0 to t0+14]
    % -------------------------------------------------------------
    % Estimate current field moisture based on days relative to dough stage
    doughStageDays = durationDays * 0.82;
    if daysSinceSowing < doughStageDays
        currentMoisture = M_initial + 8.0 * (1 - (daysSinceSowing / doughStageDays));
    else
        decayTime = daysSinceSowing - doughStageDays;
        currentMoisture = M_eq + (M_initial - M_eq) * exp(-kT * decayTime);
    end
    currentMoisture = max(M_eq + 0.5, min(42.0, currentMoisture));

    % ODE Integration: dM/dt function
    moistureOde = @(t, M) -kT * (M - M_eq);

    tspan = [0 14]; % Next 14 days
    [tSteps, mValues] = ode45(moistureOde, tspan, currentMoisture);

    % Daily sampled trajectory
    tDaily = 0:1:14;
    mDaily = interp1(tSteps, mValues, tDaily);

    % Find Day when moisture reaches safe harvest threshold M_safe
    optimalDayOffset = -1;
    for d = 1:length(mDaily)
        if mDaily(d) <= (M_safe + 0.5)
            optimalDayOffset = d - 1;
            break;
        end
    end
    if optimalDayOffset == -1
        [~, minIdx] = min(abs(mDaily - M_safe));
        optimalDayOffset = minIdx - 1;
    end

    % -------------------------------------------------------------
    % 6. Structure Results Output
    % -------------------------------------------------------------
    results = struct();
    results.crop = cropName;
    results.daysSinceSowing = daysSinceSowing;
    results.durationDays = durationDays;
    results.accumulatedGDD = round(accumulatedGDD, 1);
    results.targetGDD = targetGDD;
    results.maturityIndexPct = round(maturityIndexPct, 1);
    results.currentMoisturePct = round(currentMoisture, 2);
    results.equilibriumMoisturePct = round(M_eq, 2);
    results.targetSafeMoisturePct = M_safe;
    results.storageCriticalPct = M_critical;
    results.dryingRateK = round(kT, 4);
    results.optimalDayOffset = optimalDayOffset;
    results.odeSolver = 'Runge-Kutta Dormand-Prince (ODE45)';

    dailyTrajectory = cell(1, length(tDaily));
    for i = 1:length(tDaily)
        dayNum = tDaily(i);
        mVal = round(mDaily(i), 2);
        status = 'Ripening';
        if abs(mVal - M_safe) <= 1.2
            status = 'Optimal Harvest';
        elseif mVal < (M_safe - 1.2)
            status = 'Over-dry Risk';
        elseif mVal <= (M_safe + 2.5)
            status = 'Near Ready';
        end

        dailyTrajectory{i} = struct(...
            'dayOffset', dayNum, ...
            'moisturePct', mVal, ...
            'accumulatedGDD', round(accumulatedGDD + effTemp * dayNum, 1), ...
            'status', status ...
        );
    end
    results.trajectory = dailyTrajectory;

    % Print Summary
    fprintf('[MATLAB Simulation Results]\n');
    fprintf('  Thermal Accumulation: %.1f / %.1f GDD (%.1f%%)\n', ...
        results.accumulatedGDD, results.targetGDD, results.maturityIndexPct);
    fprintf('  Current Grain Moisture: %.2f%%\n', results.currentMoisturePct);
    fprintf('  Equilibrium Moisture (M_eq): %.2f%%\n', results.equilibriumMoisturePct);
    fprintf('  Optimal Safe Moisture (M_safe): %.1f%%\n', results.targetSafeMoisturePct);
    fprintf('  Drying Rate k(T, RH): %.4f day^-1\n', results.dryingRateK);
    fprintf('  Recommended Harvest Day Offset: +%d days\n\n', results.optimalDayOffset);

    % Save JSON for backend ingestion if invoked from CLI
    jsonStr = jsonencode(results);
    fid = fopen('matlab_simulation_output.json', 'w');
    if fid ~= -1
        fwrite(fid, jsonStr, 'char');
        fclose(fid);
        fprintf('Saved simulation output to matlab_simulation_output.json\n');
    end
end

% -----------------------------------------------------------------
% Helper: Agronomic parameters database
% -----------------------------------------------------------------
function p = getCropParameters(cropName)
    switch lower(cropName)
        case 'rice'
            p.Tbase = 10.0;
            p.Topt = 32.0;
            p.targetGDD = 2100.0;
            p.durationDays = 120;
            p.M_initial = 28.0;
            p.M_safe = 14.5;
            p.M_critical = 16.0;
            p.K1 = 1.918e-5;
            p.C1 = 51.16;
            p.C2 = 2.44;
            p.k0 = 0.12;

        case 'wheat'
            p.Tbase = 4.5;
            p.Topt = 25.0;
            p.targetGDD = 1850.0;
            p.durationDays = 125;
            p.M_initial = 26.0;
            p.M_safe = 12.5;
            p.M_critical = 14.0;
            p.K1 = 2.301e-5;
            p.C1 = 55.82;
            p.C2 = 2.28;
            p.k0 = 0.14;

        case 'maize'
            p.Tbase = 10.0;
            p.Topt = 34.0;
            p.targetGDD = 1750.0;
            p.durationDays = 100;
            p.M_initial = 32.0;
            p.M_safe = 15.5;
            p.M_critical = 17.5;
            p.K1 = 3.114e-5;
            p.C1 = 45.9;
            p.C2 = 2.15;
            p.k0 = 0.11;

        case 'tomato'
            p.Tbase = 10.0;
            p.Topt = 29.0;
            p.targetGDD = 1350.0;
            p.durationDays = 75;
            p.M_initial = 94.0;
            p.M_safe = 89.0;
            p.M_critical = 93.0;
            p.K1 = 1.2e-4;
            p.C1 = 30.0;
            p.C2 = 1.8;
            p.k0 = 0.08;

        otherwise
            % Default Rice parameters
            p = getCropParameters('rice');
    end
end
