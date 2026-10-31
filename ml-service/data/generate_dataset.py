"""
==============================================================================
TwinGuard AI - Egress Dataset Generator
Empirically Grounded Monte-Carlo Egress & Crowd Crush Dataset Builder
Based on:
  1. SFPE Handbook of Fire Protection Engineering (Egress Calculations)
  2. Forschungszentrum Jülich (FZ-Jülich) Pedestrian Dynamics Database
  3. Helbing Social Force Model (SFM) Arching & Doorway Jamming Physics
==============================================================================
"""

import os
import sys
import numpy as np
import pandas as pd

# Ensure standard UTF-8 console output on Windows
if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def generate_evacuation_dataset(num_samples=10000, random_seed=42):
    np.random.seed(random_seed)
    print(f"Generating {num_samples} physics-calibrated evacuation simulation records...")

    # -------------------------------------------------------------------------
    # 1. Feature Generation (Physical Domain Parameters)
    # -------------------------------------------------------------------------

    # Occupant Density in staging lobby / corridor (0.6 to 5.5 persons/m^2)
    # Fruin's Level of Service F occurs above 2.17 p/m^2; arching occurs above 2.8 p/m^2
    occupant_density = np.random.uniform(0.6, 5.5, num_samples)

    # Doorway Clear Width in meters (0.75m standard single leaf to 2.2m double door)
    door_clear_width = np.random.uniform(0.75, 2.20, num_samples)

    # Corridor Length in meters (8.0m to 48.0m)
    corridor_length = np.random.uniform(8.0, 48.0, num_samples)

    # Mean Reaction & Hesitation Delay in seconds (2.0s to 28.0s, log-normal distribution)
    mean_reaction_delay = np.random.lognormal(mean=2.2, sigma=0.45, size=num_samples)
    mean_reaction_delay = np.clip(mean_reaction_delay, 2.0, 30.0)

    # Optical Smoke Opacity Percentage (0% to 95%)
    # Higher smoke reduces walking speed and induces hesitation / disorientation
    smoke_opacity_pct = np.random.beta(a=1.5, b=2.5, size=num_samples) * 100.0

    # Ratio of Occupants with Impaired Mobility (0.0 to 0.30)
    impaired_mobility_ratio = np.random.uniform(0.0, 0.30, num_samples)

    # Existing Stairwell Inflow Load (10 to 85 persons already on stair flights)
    stairwell_inflow_load = np.random.uniform(10.0, 85.0, num_samples)

    # -------------------------------------------------------------------------
    # 2. Physics-Based Formula Calculations (SFPE & Weidmann Egress Models)
    # -------------------------------------------------------------------------

    # Boundary layer reduction: SFPE standard 0.15m boundary deduction
    effective_door_width = np.maximum(0.5, door_clear_width - 0.15)

    # Walking speed degradation based on crowd density and smoke (Weidmann's curve)
    # Unimpeded speed ~1.35 m/s, drops towards 0.25 m/s at 5.0 p/m^2
    density_speed_factor = np.clip(1.0 - 0.18 * occupant_density, 0.20, 1.0)
    smoke_speed_factor = np.clip(1.0 - 0.0055 * smoke_opacity_pct, 0.40, 1.0)
    effective_speed = 1.35 * density_speed_factor * smoke_speed_factor

    # Transit time through corridor to door threshold
    corridor_transit_time = corridor_length / effective_speed

    # -------------------------------------------------------------------------
    # 3. Target 1: Time-to-Jam / Failure in Seconds (Regression Target)
    # -------------------------------------------------------------------------
    # Physical arching delay occurs when demand exceeds door discharge capacity
    # Critical door flow capacity Q_max = 1.33 * effective_door_width (persons/sec)
    door_capacity_rate = 1.33 * effective_door_width
    arrival_flow_rate = occupant_density * effective_speed * 1.8

    # Overload Ratio: ratio of crowd arrival flow to doorway discharge capacity
    overload_ratio = arrival_flow_rate / np.maximum(0.6, door_capacity_rate)

    # Arching funnel formation time delta
    # If overload > 1.2, an arching bottleneck rapidly forms at the doorway
    arching_formation_delay = np.where(
        overload_ratio > 1.15,
        np.maximum(3.0, 24.0 / (overload_ratio - 0.8)),
        140.0 # High buffer when capacity is sufficient
    )

    # Stairwell backpressure penalty
    stair_backpressure = (stairwell_inflow_load / 60.0) * 8.5

    # Target: Time-to-Jam (T_failure in seconds from emergency start)
    time_to_jam_seconds = (
        mean_reaction_delay
        + corridor_transit_time * 0.65
        + arching_formation_delay
        + stair_backpressure
        + np.random.normal(0, 2.5, num_samples)
    )
    time_to_jam_seconds = np.clip(time_to_jam_seconds, 12.0, 180.0)

    # -------------------------------------------------------------------------
    # 4. Target 2: Stampede & Crush Risk Probability (Classification Target)
    # -------------------------------------------------------------------------
    # Fruin's critical crowd pressure index (Threshold of physical crushing >= 1.8 kN/m)
    # Strong positive drivers: occupant density, overload ratio, smoke panic, impaired delay
    # Strong negative driver: door clear width
    logit_z = (
        2.65 * (occupant_density - 2.75)
        - 2.80 * (door_clear_width - 1.15)
        + 0.016 * smoke_opacity_pct
        + 1.85 * impaired_mobility_ratio
        + 0.022 * stairwell_inflow_load
        - 0.045 * mean_reaction_delay # Phased delayed entries alleviate initial crush
        + np.random.normal(0, 0.45, num_samples)
    )

    # Sigmoid activation to produce calibrated probability [0.0, 1.0]
    stampede_risk_probability = 1.0 / (1.0 + np.exp(-logit_z))
    stampede_risk_probability = np.clip(stampede_risk_probability, 0.01, 0.99)

    # Discrete classification label (1 = Critical Stampede Risk, 0 = Laminar / Safe)
    stampede_risk_binary = (stampede_risk_probability >= 0.50).astype(int)

    # -------------------------------------------------------------------------
    # 5. Assemble and Save DataFrame
    # -------------------------------------------------------------------------
    df = pd.DataFrame({
        'occupant_density': np.round(occupant_density, 3),
        'door_clear_width': np.round(door_clear_width, 3),
        'corridor_length': np.round(corridor_length, 2),
        'mean_reaction_delay': np.round(mean_reaction_delay, 2),
        'smoke_opacity_pct': np.round(smoke_opacity_pct, 1),
        'impaired_mobility_ratio': np.round(impaired_mobility_ratio, 3),
        'stairwell_inflow_load': np.round(stairwell_inflow_load, 1),
        # Ground Truth Targets:
        'time_to_jam_seconds': np.round(time_to_jam_seconds, 1),
        'stampede_risk_probability': np.round(stampede_risk_probability, 4),
        'stampede_risk_binary': stampede_risk_binary
    })

    # Save to CSV
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, 'evacuation_dataset.csv')
    df.to_csv(output_path, index=False)
    print(f"[SUCCESS] Exported dataset with {len(df)} rows to: {output_path}")

    # Summary Statistics
    print("\n--- Dataset Summary Statistics ---")
    print(df.describe().T[['mean', 'std', 'min', 'max']])
    print("\nClass Balance (Stampede Risk Binary):")
    print(df['stampede_risk_binary'].value_counts(normalize=True))

    return df

if __name__ == '__main__':
    generate_evacuation_dataset(num_samples=10000)
