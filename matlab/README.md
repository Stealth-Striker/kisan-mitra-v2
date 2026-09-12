# Kisan Mitra MATLAB Bio-Agronomic Simulation Engine

> **Mathematical Core for Harvest Guardian**: Continuous non-linear grain moisture desorption ODE kinetics and Growing Degree Days (GDD) thermal phenological modeling.

---

## Project Structure

This folder is configured as a standard, portable **MATLAB Project (`.mlprj`)** compatible with **MATLAB 2020a through 2025b** and GNU Octave.

```text
matlab/
├── KisanMitra.mlprj                  # MATLAB Project definition descriptor
├── resources/                        # Project metadata & file manifest
│   └── project/
│       ├── Root.type.Files/root.xml  # Manifest of project files
│       └── project.xml               # Startup & shutdown entrypoints
├── startup.m                         # Project initialization hook (relative path loader)
├── shutdown.m                        # Project cleanup hook
├── models/                           # Core numerical ODE solvers
│   ├── harvest_bio_growth_model.m    # ODE45 Runge-Kutta continuous desorption solver
│   └── simulate_harvest_ode.m        # Batch headless CLI evaluation bridge
├── scripts/                          # Visual analytics & test suites
│   ├── plot_harvest_results.m        # 3-panel publication-grade figure generator
│   ├── run_all_simulations.m         # Master numerical verification test suite
│   └── fetch_real_weather.m          # Live Open-Meteo weather timeseries fetcher
├── data/                             # Calibrated agronomic datasets
│   ├── crop_parameters.csv           # Base temps, GDD targets, and safe moisture limits
│   ├── sample_weather_timeseries.csv # 30-day hourly weather observations (synthetic)
│   └── real_weather_timeseries.csv   # 30-day live meteorological observations (Palakkad / India)
└── README.md                         # This documentation
```

---

## Getting Started in MATLAB

### 1. Open the Project
In the MATLAB command prompt:
```matlab
openProject('matlab')
```
*Alternatively, navigate to the `matlab/` directory in MATLAB or double-click `KisanMitra.mlprj`.*

When opened, `startup.m` runs automatically, adding `models/`, `scripts/`, and `data/` to your active search path with **zero hardcoded absolute machine paths**.

### 2. (Optional) Fetch Live Real Weather
To fetch real meteorological observations for any location in India:
```matlab
% Default: Palakkad, Kerala
fetch_real_weather();

% Custom coordinates: Ludhiana, Punjab
fetch_real_weather(30.9010, 75.8573, 'Ludhiana, Punjab');

% Custom coordinates: Nashik, Maharashtra
fetch_real_weather(20.0110, 73.7900, 'Nashik, Maharashtra');
```
This saves 30 days of real observations directly to `matlab/data/real_weather_timeseries.csv`.

### 3. Run the Verification Suite
Execute the automated test matrix to verify all crop models:
```matlab
run_all_simulations
```

### 4. Generate Visual Harvest Analytics Figures
Run the visual plotting generator:
```matlab
plot_harvest_results('Rice')   % Or 'Wheat', 'Maize', 'Tomato'
```
> **Note**: `plot_harvest_results` automatically detects and uses `data/real_weather_timeseries.csv` when present, dynamically rendering the real rainfall vector and temperature/humidity averages on the figure.

This produces a 3-panel publication figure:
1. **Cumulative GDD Progression**: Accumulated thermal units vs. physiological maturity threshold.
2. **Moisture Desorption Kinetics**: Continuous Runge-Kutta decay curve vs. safe storage equilibrium ($M_{\text{target}}$) with highlighted optimal harvest day.
3. **Precipitation Risk Radar**: 14-day rainfall forecast with recommended clear-sky dry harvesting operational window.

The resulting figure is automatically exported to `matlab/harvest_simulation_results.png`.

---

## Mathematical Formulation

### 1. Growing Degree Day (GDD) Accumulation
Crop development progresses with daily thermal accumulation above the base physiological temperature:
$$GDD = \sum_{t=1}^{D} \max\left(0, \frac{T_{\max}(t) + T_{\min}(t)}{2} - T_{\text{base}}\right)$$

Calibrated parameters:
- **Paddy / Rice**: $T_{\text{base}} = 10.0^\circ\text{C}$, $GDD_{\text{target}} = 1550^\circ\text{C}\cdot\text{day}$
- **Wheat**: $T_{\text{base}} = 4.5^\circ\text{C}$, $GDD_{\text{target}} = 1700^\circ\text{C}\cdot\text{day}$
- **Maize**: $T_{\text{base}} = 10.0^\circ\text{C}$, $GDD_{\text{target}} = 1450^\circ\text{C}\cdot\text{day}$
- **Tomato**: $T_{\text{base}} = 10.0^\circ\text{C}$, $GDD_{\text{target}} = 1100^\circ\text{C}\cdot\text{day}$

### 2. Non-Linear Moisture Desorption Kinetics
Grain dry-down during ripening follows a non-linear continuous ordinary differential equation (**Modified Henderson Kinetic Model**, ASABE Standard D245.7):
$$\frac{dM}{dt} = -k_{\text{eff}}(T, RH) \cdot \left(M(t) - M_{\text{eq}}\right)$$

Where:
- $M(t)$ is the wet-basis grain moisture percentage at day $t$.
- $M_{\text{eq}}$ is the dynamic equilibrium moisture content governed by ambient relative humidity ($RH$) and temperature ($T$):
  $$M_{\text{eq}} = \max\left(10.0, M_{\text{target}} \cdot \left(1.0 - 0.25 \cdot (1.0 - RH)\right)\right)$$
- $k_{\text{eff}}(T, RH)$ is the environmental drying rate coefficient adjusted for thermal and humidity gradients:
  $$k_{\text{eff}} = k_{\text{base}} \cdot \left(1.0 + 0.03 \cdot (T - 25.0)\right) \cdot \left(1.0 - 0.3 \cdot (RH - 0.5)\right)$$

### 3. Numerical Integration
In MATLAB, the system is solved numerically using **`ode45`** (explicit Runge-Kutta 4th/5th order Dormand-Prince pair with adaptive step-size error control: `RelTol = 1e-4`, `AbsTol = 1e-6`).

---

## Integration with Kisan Mitra Web Dashboard

1. **Standalone Research Execution**: Agricultural researchers can run and refine models directly in MATLAB or Octave.
2. **Production Mirroring**: The identical differential equations and Runge-Kutta numerical parameters are mirrored in:
   - `backend/services/bioGrowthModel.js` (Express REST API backend)
   - `src/pages/HarvestGuardian.jsx` (React client-side live simulation)
   This ensures **100% mathematical fidelity** across both the MATLAB engineering environment and the real-time farmer web interface.
