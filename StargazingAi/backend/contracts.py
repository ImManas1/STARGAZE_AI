"""
contracts.py
============
Single source of truth for ALL field names and types in the project.
Teammate 1 (Backend) creates and owns this file.
Teammate 2 (AI Module) imports AI_INPUT_* constants from here.
Teammate 3 (Frontend) mirrors every FIELD_* name in contracts.js.

This file contains NO logic — only constants and TypedDicts.

RESOLVED FROM v1:
- Request field is "datetime" (not "time") — matches engineering doc + Contract A
- Conditions are "Good" | "Moderate" | "Poor" — matches engineering doc + Contract C
- confidence_band is a single int (the ± value) — matches engineering doc + Contract B/C
- forecast_confidence added to APIResponse — was missing in v1
- ErrorResponse cleaned up to match actual response shape
- AIExplanationInput removed (backend computes score; AI only returns reason)
- Scoring formula added as SCORE_WEIGHTS — deterministic, importable
"""

from typing import TypedDict, Optional, List


# =========================================================
# 1. API REQUEST CONTRACT  (Frontend → Backend)
#    Contract A — owned by Teammate 1
# =========================================================

class APIRequest(TypedDict):
    city:str
    datetime:  Optional[str] = None     # ISO 8601 UTC  e.g. "2026-04-18T22:00:00Z"
    target:   str     # one of VALID_TARGETS

VALID_TARGETS = ["moon", "mars", "jupiter", "saturn"]


# =========================================================
# 2. API RESPONSE CONTRACT  (Backend → Frontend)
#    Contract A — owned by Teammate 1
# =========================================================

class APIResponse(TypedDict):
    score:               int            # 0–100 (deterministic)
    confidence_band:     int            # ± value  e.g. 10  → displayed as "78 ± 10"
    condition:           str            # one of CONDITIONS
    best_window:         Optional[str]  # e.g. "22:00–01:00"  or None if not visible
    forecast_confidence: str            # one of CONFIDENCE_*
    reason:              str            # plain-English string from AI
    objects:             List["CelestialObject"]
    error:               Optional[str]  # None on success, error message on failure


class ErrorResponse(TypedDict):
    score:               Optional[int]
    confidence_band:     Optional[int]
    condition:           Optional[str]
    best_window:         Optional[str]
    forecast_confidence: Optional[str]
    reason:              Optional[str]
    objects:             Optional[List["CelestialObject"]]
    error:               str            # always present, never None


# =========================================================
# 3. CONDITION LABELS
# =========================================================

CONDITION_GOOD      = "Good"
CONDITION_MODERATE  = "Moderate"
CONDITION_POOR      = "Poor"

CONDITIONS = [CONDITION_GOOD, CONDITION_MODERATE, CONDITION_POOR]


# =========================================================
# 4. FORECAST CONFIDENCE LABELS
# =========================================================

CONFIDENCE_HIGH   = "High"    # forecast < 6 hours out
CONFIDENCE_MEDIUM = "Medium"  # forecast 6–24 hours out
CONFIDENCE_LOW    = "Low"     # forecast > 24 hours out

CONFIDENCE_LEVELS = [CONFIDENCE_HIGH, CONFIDENCE_MEDIUM, CONFIDENCE_LOW]


# =========================================================
# 5. CELESTIAL OBJECT CONTRACT
# =========================================================

class CelestialObject(TypedDict):
    name:         str    # e.g. "Jupiter"
    altitude_deg: float  # current altitude in degrees above horizon
    visible:      bool   # True if above horizon during best_window


# =========================================================
# 6. DATA AGGREGATION CONTRACT  (External APIs → Internal)
#    Used inside the backend only — not exposed to frontend or AI module
# =========================================================

class DataInput(TypedDict):
    cloud_cover:        float  # 0–100 percent
    moon_illumination:  float  # 0–100 percent
    altitude_deg:       float  # –90 to +90 degrees
    bortle_class:       int    # 1 (darkest) to 9 (most light-polluted)
    humidity:           float  # 0–100 percent
    forecast_hours_out: int    # hours ahead (drives forecast_confidence label)


# =========================================================
# 7. call_ai() CONTRACT  (Backend → AI Module)
#    Contract B — Teammate 1 sends this; Teammate 2 receives it
#
#    INPUT  — Teammate 1 always sends exactly these 6 keys:
#
#        cloud_cover        int   0–100 %
#        humidity           int   0–100 %
#        moon_illumination  int   0–100 %
#        altitude_deg       float degrees above horizon
#        bortle_class       int   1–9
#        forecast_hours_out int   hours ahead
#
#    OUTPUT — Teammate 2 always returns exactly 1 key:
#
#        reason   str   one plain-English sentence
#
#    NOTE: score, confidence_band, condition, best_window are computed
#    deterministically by the backend (see SCORE_WEIGHTS below).
#    The AI module only explains the score; it never changes it.
# =========================================================

# Keys Teammate 1 puts into the call_ai() input dict
AI_INPUT_CLOUD     = "cloud_cover"
AI_INPUT_HUMIDITY  = "humidity"
AI_INPUT_MOON      = "moon_illumination"
AI_INPUT_ALTITUDE  = "altitude_deg"
AI_INPUT_BORTLE    = "bortle_class"
AI_INPUT_HOURS_OUT = "forecast_hours_out"

# Key Teammate 2 returns in the call_ai() output dict
AI_OUTPUT_REASON   = "reason"


# =========================================================
# 8. HTTP RESPONSE FIELD NAME CONSTANTS
#    Import these wherever you build or read a response dict.
#    Never type a field name as a raw string anywhere else.
# =========================================================

FIELD_SCORE        = "score"
FIELD_CONF_BAND    = "confidence_band"
FIELD_CONDITION    = "condition"
FIELD_BEST_WINDOW  = "best_window"
FIELD_FORECAST_CONF= "forecast_confidence"
FIELD_REASON       = "reason"
FIELD_OBJECTS      = "objects"
FIELD_ERROR        = "error"


# =========================================================
# 9. DETERMINISTIC SCORING FORMULA
#    Used in scorer.py — do not duplicate elsewhere.
#    Weights sum to 100.
# =========================================================

#   score = cloud_weight  * (1 - cloud_cover / 100)
#         + moon_weight   * (1 - moon_illumination / 100)
#         + altitude_weight * (altitude_deg / 90)
#         + bortle_weight * (1 - bortle_class / 9)

SCORE_WEIGHT_CLOUD    = 40
SCORE_WEIGHT_MOON     = 20
SCORE_WEIGHT_ALTITUDE = 20
SCORE_WEIGHT_BORTLE   = 20


# =========================================================
# 10. SYSTEM RULES  (documentation only)
# =========================================================

"""
RULES:

1.  The scoring is DETERMINISTIC.
    compute_score() in scorer.py uses SCORE_WEIGHT_* above.
    The AI module (call_ai) only generates the reason string.
    AI NEVER affects: score, confidence_band, condition, best_window, objects.

2.  confidence_band is a single int — the ± range.
    Display as: "78 ± 10"  (score=78, confidence_band=10).

3.  forecast_confidence is derived from forecast_hours_out:
        < 6 h  →  "High"
        6–24 h →  "Medium"
        > 24 h →  "Low"

4.  best_window can be None — always null-check before rendering.
    None means the target is not visible in the next 12 hours.

5.  Always check the error field first.
    On error, every other field may be None.

6.  API never returns partial data:
        success → full APIResponse  (error = None)
        failure → ErrorResponse     (error = non-empty string)

7.  datetime in the request must be ISO 8601 UTC.
    All internal calculations use UTC. Never use local time.

8.  objects can be an empty list — handle the zero-item case.

9.  Bortle class mapping:
        Remote   → 1–2
        Rural    → 2–3
        Suburban → 5–6
        Urban    → 8–9

10. Best-window algorithm:
        Evaluate conditions every 30 min over next 12 hours.
        Compute score at each step.
        Group into 3-hour blocks.
        Return the block with the highest average score.

11. Caching: cache full APIResponse by (round(lat,2), round(lon,2), 1-hour bucket).
    Serve cached result without calling Skyfield, OpenWeather, or Claude.

12. Field names in this file are the single source of truth.
    No extra keys. No missing keys. No raw strings elsewhere.
"""