# Kisan Mitra MATLAB Bio-Agronomic Simulation Engine

## Overview
This directory contains the authentic mathematical model developed for **Kisan Mitra Harvest Guardian**. It calculates thermal crop development (Growing Degree Days, GDD) and grain moisture desorption kinetics using ordinary differential equations.

## Mathematical Formulation

### 1. Growing Degree Day (GDD) Accumulation
Crop development progresses with accumulated thermal energy:
$$GDD = \sum_{t=1}^{D} \max\left(0, \frac{T_{\max} + T_{\min}}{2} - T_{\text{base}}\right)$$
- **Rice**: $T_{\text{base}} = 10.0^\circ\text{C}$, $GDD_{\text{target}} = 1550$ GDD
- **Wheat**: $T_{\text{base}} = 4.5^\circ\text{C}$, $GDD_{\text{target}} = 1700$ GDD
- **Maize**: $T_{\text{base}} = 10.0^\circ\text{C}$, $GDD_{\text{target}} = 1450$ GDD

### 2. Grain Moisture Dry-Down Differential Equation
Grain moisture reduction during ripening follows a continuous first-order non-linear differential equation (modified Henderson model):
$$\frac{dM}{dt} = -k(T, RH) \cdot (M(t) - M_{\text{eq}})$$

Where:
- $M(t)$ is grain moisture percentage at day $t$
- $M_{\text{eq}}$ is the dynamic equilibrium moisture content based on atmospheric relative humidity ($RH$) and temperature ($T$)
- $k(T, RH)$ is the environmental drying coefficient adjusted for temperature and humidity variations

### 3. Numerical Integration
In MATLAB, the system is integrated using **`ode45`** (explicit Runge-Kutta 4th/5th order formula with adaptive step size).

## How to Run in MATLAB

1. Open MATLAB and navigate to the `matlab/` folder:
   ```matlab
   cd matlab
   ```
2. Run the simulation function:
   ```matlab
   results = harvest_bio_growth_model('Rice', '2026-06-01', 29.5, 68);
   ```

## Web Application Integration
For hackathon zero-license runtime environments (e.g. running on cloud servers or judges' machines without MATLAB licenses), the identical differential equation and Runge-Kutta state-space solver is mirrored natively in `src/pages/HarvestGuardian.jsx`, allowing seamless browser and server execution while maintaining 100% mathematical fidelity.
