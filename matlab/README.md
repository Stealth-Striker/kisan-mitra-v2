# Harvest Guardian: MATLAB Bio-Growth Simulation & Grain Moisture ODE Model

This directory contains the mathematical bio-growth and moisture decay models developed for **Kisan Mitra's Harvest Guardian**.

---

## 1. Mathematical Formulation

Harvest Guardian relies on a dual-engine architecture:
- **MATLAB / Simulink Analytical Core**: Solves the deterministic physiological equations governing thermal plant accumulation and moisture dissipation in cereal grains and horticultural crops.
- **Google Gemini 2.5 Cognitive Layer**: Merges the deterministic maturity dates with real-time meteorological forecasts, regional rain radars, and machinery logistics.

### 1.1 Thermal Accumulation: Growing Degree Days (GDD)
Plant phenological stages are dictated by heat units rather than calendar days:

$$GDD = \sum_{t=0}^{T} \max\left(0, \min(T_{\text{avg}}(t), T_{\text{opt}}) - T_{\text{base}}\right)$$

Where:
- $T_{\text{base}}$: Base physiological temperature threshold below which development ceases.
- $T_{\text{opt}}$: Upper optimum temperature ceiling.
- $T_{\text{avg}} = \frac{T_{\text{max}} + T_{\text{min}}}{2}$: Daily mean air temperature.

### 1.2 Modified Henderson Equilibrium Moisture Content ($M_{eq}$)
Grain cannot dry below the ambient moisture equilibrium governed by atmospheric Relative Humidity ($RH$) and Ambient Temperature ($T$):

$$M_{eq} = \left( \frac{-\ln(1 - RH / 100)}{K_1 \cdot (T + C_1)} \right)^{\frac{1}{C_2}} \times 100$$

Where $K_1, C_1, C_2$ are crop-specific Henderson-Thompson constants calibrated from empirical hygroscopic isotherms.

### 1.3 Grain Moisture Decay Differential Equation
The rate of moisture loss from late grain dough stage to physiological maturity follows a first-order continuous ordinary differential equation:

$$\frac{dM(t)}{dt} = -k(T, RH) \cdot \left( M(t) - M_{eq} \right)$$

With the temperature and vapor pressure-dependent drying coefficient:

$$k(T, RH) = k_0 \cdot \left[1 + 0.04(T - 25)\right] \cdot \left[0.6 + 0.8\left(1 - \frac{RH}{100}\right)\right]$$

### 1.4 Numerical Solution (ODE45 / Runge-Kutta 4th Order)
Integrated over the 14-day projection window $t \in [0, 14]$ days using MATLAB's Dormand-Prince variable step solver (`ode45`):

$$M(t_{n+1}) = M(t_n) + \frac{h}{6} (k_1 + 2k_2 + 2k_3 + k_4)$$

---

## 2. Crop Calibration Parameters

| Crop | $T_{\text{base}}$ (°C) | Target GDD | $M_0$ Initial (%) | Safe Harvest $M_{\text{safe}}$ (%) | Critical Storage $M_{\text{crit}}$ (%) | $k_0$ ($\text{day}^{-1}$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Rice (Paddy)** | 10.0 | 2100 | 28.0% | 14.5% | 16.0% | 0.12 |
| **Wheat** | 4.5 | 1850 | 26.0% | 12.5% | 14.0% | 0.14 |
| **Maize** | 10.0 | 1750 | 32.0% | 15.5% | 17.5% | 0.11 |
| **Tomato** | 10.0 | 1350 | 94.0% | 89.0% | 93.0% | 0.08 |

---

## 3. Simulink Block Diagram Representation

```
 [ Daily T_max, T_min ] ---> [ (Tmax + Tmin)/2 ] ---> [ Subtractor: - T_base ] ---> [ Saturation: >= 0 ] ---> [ Discrete Integrator ] ---> [ Accumulated GDD ]
                                                                                                                                                 │
                                                                                                                                                 ▼
 [ Ambient RH % ] ─────────> [ Modified Henderson Subsystem ] ───> [ M_eq ]                                                        [ Maturity Index % ]
                                                                      │
                                                                      ▼
                                                             [ Difference: M(t) - M_eq ]
                                                                      │
 [ k(T, RH) Rate Generator ] ─────────────────────────────────────────* (Product)
                                                                      │
                                                                      ▼
                                                             [ Integrator: dM/dt ] <── [ Initial Moisture M_0 ]
                                                                      │
                                                                      ▼
                                                             [ M(t) Moisture Curve ]
                                                                      │
                                          ┌───────────────────────────┴───────────────────────────┐
                                          ▼                                                       ▼
                            [ Safe Harvest Window Detector ]                         [ Storage Spoilage Warning ]
                            (14.0% <= M(t) <= 15.5%)                                 (M(t) > M_crit => High Mold Risk)
```

---

## 4. Running the Model in MATLAB

1. Open MATLAB (R2020a or newer).
2. Set the working directory to `matlab/`.
3. Run in the Command Window:
   ```matlab
   results = harvest_bio_growth_model('Rice', 105, 30.5, 65.0);
   ```
4. Or run headless from terminal/PowerShell:
   ```powershell
   matlab -batch "harvest_bio_growth_model('Wheat', 110, 26.0, 55.0)"
   ```
5. Output JSON is generated at `matlab_simulation_output.json`.

---

## 5. Web App Bridge & Zero-Dependency Execution
To guarantee seamless hackathon evaluations in environments without MATLAB licenses:
- `backend/services/matlabBioGrowthEngine.js` implements the exact identical mathematical formulations, Henderson isotherm coefficients, and Runge-Kutta numerical integration on Node.js.
- This ensures **sub-10ms response times**, high reliability, and zero third-party system dependencies for judges.
