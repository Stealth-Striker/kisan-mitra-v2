function res = simulate_harvest_ode(crop, days, temp, humidity)
%% SIMULATE_HARVEST_ODE
% Standalone entrypoint for batch evaluation of crop drying differential equations.
% Compatible with MATLAB 2020a through 2025b and GNU Octave.
%
% Example:
%   res = simulate_harvest_ode('Rice', 105, 30.0, 65.0);

    if nargin < 1 || isempty(crop), crop = 'Rice'; end
    if nargin < 2 || isempty(days), days = 105; end
    if nargin < 3 || isempty(temp), temp = 30.0; end
    if nargin < 4 || isempty(humidity), humidity = 65.0; end

    if ischar(days), days = str2double(days); end
    if ischar(temp), temp = str2double(temp); end
    if ischar(humidity), humidity = str2double(humidity); end

    sowDateStr = datestr(now - days, 'yyyy-mm-dd');
    res = harvest_bio_growth_model(crop, sowDateStr, temp, humidity);
    disp('[OK] Kisan Mitra Harvest ODE Simulation finished successfully.');
end
