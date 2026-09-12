%% RUN_ALL_SIMULATIONS
% Master automated verification script for Kisan Mitra MATLAB bio-growth engine.
% Executes ODE45 simulations across major Indian crops and validates numerical constraints.

function status = run_all_simulations()
    fprintf('========================================================\n');
    fprintf('  RUNNING KISAN MITRA BIO-AGRONOMIC VERIFICATION SUITE\n');
    fprintf('========================================================\n\n');

    thisDir = fileparts(mfilename('fullpath'));
    rootDir = fileparts(thisDir);
    addpath(fullfile(rootDir, 'models'));
    addpath(fullfile(rootDir, 'data'));

    crops = {'Rice', 'Wheat', 'Maize', 'Tomato'};
    passCount = 0;
    totalTests = length(crops);

    for i = 1:totalTests
        crop = crops{i};
        fprintf('[TEST %d/%d] Evaluating crop: %s...\n', i, totalTests, crop);

        try
            sowDate = datestr(now - 100, 'yyyy-mm-dd');
            res = harvest_bio_growth_model(crop, sowDate, 29.0, 65.0);

            % Assertions
            assert(~isnan(res.gddAccumulated), 'GDD accumulation returned NaN');
            assert(res.gddAccumulated >= 0, 'GDD accumulation is negative');
            assert(res.currentMoisture > 0, 'Current moisture is non-positive');
            assert(res.daysToOptimal >= 0 && res.daysToOptimal <= 14, 'Days to optimal out of bounds');
            assert(length(res.daily_moisture) == 15, 'Moisture trajectory length incorrect');
            assert(res.daily_moisture(end) <= res.daily_moisture(1), 'Moisture failed to decay monotonically');

            fprintf('   -> PASS: %s (GDD: %.1f/%.1f | Moisture: %.1f%% -> %.1f%% in %d days)\n\n', ...
                    crop, res.gddAccumulated, res.gddTarget, res.currentMoisture, res.targetMoisture, res.daysToOptimal);
            passCount = passCount + 1;
        catch err
            fprintf('   -> FAIL: %s (%s)\n\n', crop, err.message);
        end
    end

    fprintf('========================================================\n');
    fprintf('  TEST SUMMARY: %d / %d PASSED (%.1f%%)\n', passCount, totalTests, (passCount / totalTests) * 100);
    fprintf('========================================================\n');

    if passCount == totalTests
        status = 0;
        disp('[SUCCESS] All agronomic ODE differential models verified.');
    else
        status = 1;
        disp('[ERROR] One or more simulations failed numerical verification.');
    end
end
