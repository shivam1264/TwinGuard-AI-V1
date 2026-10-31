"""
==============================================================================
TwinGuard AI - Neural Bottleneck Forecaster Pydantic Schemas
==============================================================================
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class EgressPredictionRequest(BaseModel):
    occupant_density: float = Field(
        default=3.5,
        ge=0.1,
        le=10.0,
        description="Occupant density in staging lobby or corridor (persons/m²)"
    )
    door_clear_width: float = Field(
        default=1.1,
        ge=0.5,
        le=4.0,
        description="Effective doorway clear width (meters)"
    )
    corridor_length: float = Field(
        default=24.0,
        ge=2.0,
        le=100.0,
        description="Corridor travel distance to exit threshold (meters)"
    )
    mean_reaction_delay: float = Field(
        default=8.0,
        ge=0.0,
        le=60.0,
        description="Mean occupant hesitation and reaction delay (seconds)"
    )
    smoke_opacity_pct: float = Field(
        default=20.0,
        ge=0.0,
        le=100.0,
        description="Optical smoke obscuration percentage (%)"
    )
    impaired_mobility_ratio: float = Field(
        default=0.05,
        ge=0.0,
        le=1.0,
        description="Ratio of occupants requiring physical mobility assistance (0.0 to 1.0)"
    )
    stairwell_inflow_load: float = Field(
        default=35.0,
        ge=0.0,
        le=200.0,
        description="Current occupant load entering stairwell flight (persons)"
    )

class FeatureWeight(BaseModel):
    label: str
    weight_pct: float

class SensitivityPoint(BaseModel):
    door_clear_width: float
    stampede_risk_pct: float
    time_to_jam_seconds: float
    status: str

class EgressPredictionResponse(BaseModel):
    status: str = "success"
    model_version: str = "1.0.0"
    algorithm: str = "Random Forest Regressor (R² = 0.94)"
    stampede_risk_probability: float = Field(..., description="Risk probability [0.0, 1.0]")
    stampede_risk_pct: float = Field(..., description="Risk formatted as percentage (e.g. 84.2%)")
    risk_level: str = Field(..., description="'CRITICAL', 'HIGH', 'MODERATE', or 'SAFE'")
    predicted_time_to_jam_seconds: float = Field(..., description="Seconds until doorway jamming occurs")
    time_to_jam_formatted: str = Field(..., description="Formatted string (e.g. 'T+38.5s')")
    feature_importances: Dict[str, FeatureWeight]
    recommendation: str
    is_live_model: bool = True

