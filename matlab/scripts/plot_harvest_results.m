%% PLOT_HARVEST_RESULTS
% Publication-Grade 3-Panel Visual Analytics for Kisan Mitra Harvest Guardian
%
% Produces:
%   1. Cumulative GDD Thermal Units vs Target Threshold
%   2. Non-linear Grain Moisture Desorption Kinetics vs Safe Storage Target
%   3. Precipitation Risk & Dry Harvesting Operational Window
%
% Usage:
%   plot_harvest_results('Rice');
%   plot_harvest_results('Wheat');

function plot_harvest_results(cropName)
    if nargin < 1 || isempty(cropName), cropName = 'Rice'; end

    % Ensure model paths are loaded
    thisDir = fileparts(mfilename('fullpath'));
    rootDir = fileparts(thisDir);
    addpath(fullfile(rootDir, 'models'));
    % Load weather dataset (prefers real_weather_timeseries.csv, falls back to sample)
    realWeatherFile = fullfile(rootDir, 'data', 'real_weather_timeseries.csv');
    sampleWeatherFile = fullfile(rootDir, 'data', 'sample_weather_timeseries.csv');

    weatherTable = [];
    dataSourceLabel = 'Sample Climatology';
    if exist(realWeatherFile, 'file') == 2
        try
            weatherTable = readtable(realWeatherFile);
            dataSourceLabel = 'Live Open-Meteo Observations';
            fprintf('[DATA] Using Real Weather Timeseries (%s)\n', realWeatherFile);
        catch
            weatherTable = [];
        end
    end

    if isempty(weatherTable) && exist(sampleWeatherFile, 'file') == 2
        try
            weatherTable = readtable(sampleWeatherFile);
            dataSourceLabel = 'Calibrated Sample Timeseries';
        catch
            weatherTable = [];
        end
    end

    % Compute input averages from weather dataset
    if ~isempty(weatherTable) && ismember('temp_mean_c', weatherTable.Properties.VariableNames)
        simTemp = mean(weatherTable.temp_mean_c);
        simRH = mean(weatherTable.rh_pct);
    else
        simTemp = 29.5;
        simRH = 68.0;
    end

    % Run simulation
    sowDate = datestr(now - 105, 'yyyy-mm-dd');
    results = harvest_bio_growth_model(cropName, sowDate, simTemp, simRH);

    % Create figure
    fig = figure('Name', ['Kisan Mitra Harvest Analytics - ' cropName], ...
                 'Color', 'w', 'Position', [100, 100, 1050, 750], 'Visible', 'on');

    % Color palette (Kisan Mitra green theme)
    cDarkGreen = [6, 63, 46] / 255;
    cMidGreen  = [8, 127, 91] / 255;
    cLightGreen= [221, 245, 234] / 255;
    cRed       = [224, 49, 49] / 255;
    cGray      = [101, 115, 108] / 255;

    %% Panel 1: GDD Accumulation
    subplot(3, 1, 1);
    daysVec = 0:results.daysElapsed;
    dailyGddRate = results.gddAccumulated / max(1, results.daysElapsed);
    gddCurve = daysVec * dailyGddRate;

    plot(daysVec, gddCurve, 'Color', cMidGreen, 'LineWidth', 2.2);
    hold on;
    yline(results.gddTarget, '--', ['Target GDD: ' num2str(results.gddTarget)], ...
          'Color', cDarkGreen, 'LineWidth', 1.8, 'LabelHorizontalAlignment', 'left');
    scatter(results.daysElapsed, results.gddAccumulated, 60, cDarkGreen, 'filled');

    grid on;
    box on;
    set(gca, 'FontSize', 10, 'GridColor', [0.85 0.85 0.85]);
    xlabel('Days Since Sowing (Days)', 'FontSize', 10, 'FontWeight', 'bold');
    ylabel('Cumulative GDD (°C·day)', 'FontSize', 10, 'FontWeight', 'bold');
    title([cropName ' - Thermal Maturity Progression (GDD Accumulated: ' ...
           num2str(results.gddAccumulated) ' / ' num2str(results.gddTarget) ' - ' ...
           num2str(results.maturityPct) '%)'], 'FontSize', 11, 'FontWeight', 'bold', 'Color', cDarkGreen);

    %% Panel 2: Continuous Moisture Desorption ODE (Runge-Kutta)
    subplot(3, 1, 2);
    plot(results.t_out, results.M_out, 'Color', cMidGreen, 'LineWidth', 2.2);
    hold on;
    yline(results.targetMoisture, '--', ['Safe Harvest Target: ' num2str(results.targetMoisture) '%'], ...
          'Color', cDarkGreen, 'LineWidth', 1.8, 'LabelHorizontalAlignment', 'left');

    % Shade safe harvest region
    xOptimal = results.daysToOptimal;
    if xOptimal < 14
        patch([xOptimal, 14, 14, xOptimal], ...
              [0, 0, results.targetMoisture + 1.0, results.targetMoisture + 1.0], ...
              cLightGreen, 'FaceAlpha', 0.5, 'EdgeColor', 'none');
        xline(xOptimal, ':', ['Optimal Day: +' num2str(xOptimal) 'd (' results.predictedHarvestDate ')'], ...
              'Color', cMidGreen, 'LineWidth', 1.5);
    end

    ylim([max(10, results.targetMoisture - 3), max(results.M_out) + 2]);
    xlim([0, 14]);
    grid on;
    box on;
    set(gca, 'FontSize', 10, 'GridColor', [0.85 0.85 0.85]);
    xlabel('Forecast Day Index (+days)', 'FontSize', 10, 'FontWeight', 'bold');
    ylabel('Grain Moisture (% w.b.)', 'FontSize', 10, 'FontWeight', 'bold');
    title('Grain Moisture Desorption Kinetics (ASABE D245.7 Non-Linear ODE45 Solution)', ...
          'FontSize', 11, 'FontWeight', 'bold', 'Color', cDarkGreen);

    %% Panel 3: Precipitation Risk & Dry Harvesting Opportunity
    subplot(3, 1, 3);
    forecastDays = 0:13;

    if ~isempty(weatherTable) && ismember('rainfall_mm', weatherTable.Properties.VariableNames) && height(weatherTable) >= 14
        rainRiskMm = weatherTable.rainfall_mm(1:14)';
    else
        % Synthetic fallback profile
        rainRiskMm = [0, 0, 0, 0, 1.2, 18.5, 34.0, 6.2, 0, 0, 0, 2.5, 22.0, 0];
    end

    b = bar(forecastDays, rainRiskMm, 0.6, 'FaceColor', [0.3 0.6 0.9], 'EdgeColor', 'none');
    hold on;
    yline(5.0, '-.', 'Rain Risk Cutoff (5mm)', 'Color', cRed, 'LineWidth', 1.4);

    % Highlight recommended dry harvest window (days with rainfall < 5mm)
    dryWindowDays = forecastDays(rainRiskMm < 5.0);
    if ~isempty(dryWindowDays)
        bar(dryWindowDays, rainRiskMm(dryWindowDays + 1), 0.6, 'FaceColor', cMidGreen, 'EdgeColor', 'none');
    end

    grid on;
    box on;
    set(gca, 'FontSize', 10, 'GridColor', [0.85 0.85 0.85]);
    xlabel('Forecast Day Index (+days)', 'FontSize', 10, 'FontWeight', 'bold');
    ylabel('Daily Rainfall (mm)', 'FontSize', 10, 'FontWeight', 'bold');
    title(sprintf('14-Day Rainfall Risk & Dry Harvest Window (Green) [%s]', dataSourceLabel), ...
          'FontSize', 11, 'FontWeight', 'bold', 'Color', cDarkGreen);

    % Export high-resolution artifact
    outPath = fullfile(rootDir, 'harvest_simulation_results.png');
    saveas(fig, outPath);
    fprintf('[OK] Figure saved successfully to: %s\n', outPath);
end
