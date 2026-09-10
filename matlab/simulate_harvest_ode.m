%% SIMULATE_HARVEST_ODE
% Standalone entrypoint for batch evaluation of crop drying differential equations
% Compatible with MATLAB 2020a through 2025b and GNU Octave.

function simulate_harvest_ode(crop, days, temp, humidity)
    if nargin < 1, crop = 'Rice'; end
    if nargin < 2, days = 105; end
    if nargin < 3, temp = 30.0; end
    if nargin < 4, humidity = 65.0; end

    if ischar(days), days = str2double(days); end
    if ischar(temp), temp = str2double(temp); end
    if ischar(humidity), humidity = str2double(humidity); end

    res = harvest_bio_growth_model(crop, days, temp, humidity);
    disp('Simulation finished successfully.');
end
