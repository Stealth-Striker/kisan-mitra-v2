%% FETCH_REAL_WEATHER
% Fetches real-world historical and forecast meteorological timeseries
% from Open-Meteo Agroclimatology API for any farm coordinates (No API key required).
%
% Usage:
%   dataTable = fetch_real_weather();                           % Default: Palakkad, Kerala
%   dataTable = fetch_real_weather(30.9010, 75.8573, 'Punjab'); % Ludhiana, Punjab
%   dataTable = fetch_real_weather(20.0110, 73.7900, 'Nashik'); % Nashik, Maharashtra

function dataTable = fetch_real_weather(latitude, longitude, locationName)
    if nargin < 1 || isempty(latitude), latitude = 10.7867; end
    if nargin < 2 || isempty(longitude), longitude = 76.6548; end
    if nargin < 3 || isempty(locationName), locationName = 'Palakkad, Kerala'; end

    fprintf('====================================================\n');
    fprintf('  FETCHING REAL WEATHER TIMESERIES (OPEN-METEO)\n');
    fprintf('====================================================\n');
    fprintf('Location: %s (Lat: %.4f, Lon: %.4f)\n', locationName, latitude, longitude);

    apiUrl = sprintf(['https://api.open-meteo.com/v1/forecast?' ...
                     'latitude=%.4f&longitude=%.4f&' ...
                     'daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max&' ...
                     'past_days=21&forecast_days=9&timezone=Asia%%2FKolkata'], ...
                     latitude, longitude);

    try
        options = weboptions('Timeout', 15);
        apiData = webread(apiUrl, options);

        dates = apiData.daily.time;
        tMax = apiData.daily.temperature_2m_max;
        tMin = apiData.daily.temperature_2m_min;
        tMean = (tMax + tMin) / 2.0;
        precip = apiData.daily.precipitation_sum;
        rh = apiData.daily.relative_humidity_2m_mean;
        wind = apiData.daily.wind_speed_10m_max;

        N = length(dates);
        dayIndices = (1:N)';

        % Build MATLAB Table
        dataTable = table(dayIndices, dates, tMin, tMax, tMean, rh, precip, wind, ...
            'VariableNames', {'day', 'date', 'temp_min_c', 'temp_max_c', 'temp_mean_c', 'rh_pct', 'rainfall_mm', 'wind_speed_kmh'});

        % Write to matlab/data/real_weather_timeseries.csv
        thisDir = fileparts(mfilename('fullpath'));
        rootDir = fileparts(thisDir);
        outPath = fullfile(rootDir, 'data', 'real_weather_timeseries.csv');

        writetable(dataTable, outPath);
        fprintf('[OK] Successfully saved %d real days of weather observations to:\n     %s\n', N, outPath);
        fprintf('====================================================\n');

    catch err
        fprintf('[WARN] Web request failed: %s\n', err.message);
        fprintf('Falling back to reading local sample dataset.\n');
        thisDir = fileparts(mfilename('fullpath'));
        rootDir = fileparts(thisDir);
        fallbackPath = fullfile(rootDir, 'data', 'sample_weather_timeseries.csv');
        dataTable = readtable(fallbackPath);
    end
end
