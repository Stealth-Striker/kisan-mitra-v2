%% STARTUP.M
% Automatically executed upon opening the Kisan Mitra MATLAB Project.
% Configures search paths using relative directory resolution (100% portable).

function startup()
    projectRoot = fileparts(mfilename('fullpath'));

    % Add project subfolders to path
    addpath(fullfile(projectRoot, 'models'));
    addpath(fullfile(projectRoot, 'scripts'));
    addpath(fullfile(projectRoot, 'data'));

    fprintf('\n');
    fprintf('===================================================================\n');
    fprintf('           KISAN MITRA BIO-AGRONOMIC SIMULATION PROJECT            \n');
    fprintf('===================================================================\n');
    fprintf('  Harvest Guardian Thermal GDD & Moisture Desorption ODE Engine   \n');
    fprintf('-------------------------------------------------------------------\n');
    fprintf('  Quick Commands:\n');
    fprintf('    >> run_all_simulations       %% Run comprehensive verification suite\n');
    fprintf('    >> plot_harvest_results      %% Generate 3-panel publication plots\n');
    fprintf('    >> fetch_real_weather        %% Fetch live Open-Meteo weather for any farm\n');
    fprintf('    >> harvest_bio_growth_model  %% Run individual crop simulation\n');
    fprintf('===================================================================\n\n');
end
