%% SHUTDOWN.M
% Automatically executed upon closing the Kisan Mitra MATLAB Project.
% Restores clean MATLAB environment paths.

function shutdown()
    projectRoot = fileparts(mfilename('fullpath'));

    % Remove project subfolders from path
    warning('off', 'MATLAB:rmpath:DirNotFound');
    rmpath(fullfile(projectRoot, 'models'));
    rmpath(fullfile(projectRoot, 'scripts'));
    rmpath(fullfile(projectRoot, 'data'));
    warning('on', 'MATLAB:rmpath:DirNotFound');

    fprintf('[Kisan Mitra Project] Closed cleanly. Search paths restored.\n');
end
