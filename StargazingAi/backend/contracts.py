"""
contracts.py

Defines ALL system contracts:
- API layer (request/response)
- Internal data structures
- Scoring output
- AI explanation interface

This file contains NO logic.
Only structure + constants.
"""

from typing import TypedDict, Tuple, Optional, List

# =========================================================
# 1. API REQUEST CONTRACT (Frontend → Backend)
# =========================================================

class APIRequest(TypedDict):
    lat:    float
    lon:    float
    time:   str    # ISO 8601 UTC e.g. "2026-04-18T22:00:00Z"
    target: str    # one of VALID_TARGETS


VALID_TARGETS = ["moon", "mars", "jupiter", "saturn"]


# =========================================================
# 2. DATA AGGREGATION CONTRACT (External APIs → Internal)
# =========================================================

class DataInput(TypedDict):
    cloud_cover:        float  # 0–100 percent
    moon_illumination:  float  # 0–100 percent
    altitude:           float  # -90 to +90 degrees
    bortle_class:       int    # 1 (darkest) to 9 (most polluted)
    humidity:           float  # 0–100 percent
    forecast_hours_out: int    # hours ahead (used for confidence label)


# =========================================================
# 3. SCORING CONTRACT (CORE ENGINE OUTPUT)
# =========================================================

class ScoreOutput(TypedDict):
    score:       int                # 0–100
    condition:   str                # one of CONDITIONS
    confidence:  Tuple[int, int]    # (low, high) e.g. (68, 88)
    best_window: Optional[str]      # e.g. "21:00–23:00" or None if not visible


CONDITIONS = ["Excellent", "Good", "Poor"]

CONDITION_EXCELLENT = "Excellent"
CONDITION_GOOD      = "Good"
CONDITION_POOR      = "Poor"

CONFIDENCE_HIGH     = "High"
CONFIDENCE_MEDIUM   = "Medium"
CONFIDENCE_LOW      = "Low"


# =========================================================
# 4. AI EXPLANATION CONTRACT (STRICTLY ISOLATED)
# =========================================================
# Defines what call_ai() in ai_scorer.py receives.
# AI MUST only return a plain-English reason string.
# AI MUST NOT modify score, condition, confidence, or best_window.

class AIExplanationInput(TypedDict):
    score:             int
    condition:         str
    cloud_cover:       float
    moon_illumination: float
    altitude:          float
    bortle_class:      int
    best_window:       Optional[str]


# =========================================================
# 5. CELESTIAL OBJECT CONTRACT
# =========================================================

class CelestialObject(TypedDict):
    name:         str    # e.g. "Jupiter"
    altitude_deg: float  # current altitude in degrees
    visible:      bool   # True if above horizon during best_window


# =========================================================
# 6. FINAL API RESPONSE CONTRACT (Backend → Frontend)
# =========================================================

class APIResponse(TypedDict):
    score:       int
    condition:   str
    confidence:  Tuple[int, int]       # (low, high) e.g. (68, 88)
    best_window: Optional[str]
    reason:      str
    objects:     List[CelestialObject]


# =========================================================
# 7. ERROR RESPONSE CONTRACT
# =========================================================

class ErrorResponse(TypedDict):
    score:       Optional[int]
    condition:   Optional[str]
    confidence:  Optional[Tuple[int, int]]
    best_window: Optional[str]
    reason:      Optional[str]
    objects:     Optional[List[CelestialObject]]
    error:       str                   # always present, never None


# =========================================================
# 8. SYSTEM RULES (DOCUMENTATION ONLY)
# =========================================================

"""
RULES:

1. AI NEVER affects:
   - score
   - condition
   - confidence
   - best_window
   - objects

2. compute_score() MUST be:
   - deterministic
   - bounded (0–100)
   - repeatable with same inputs

3. collect_data() MUST:
   - always return all DataInput fields
   - normalize units before returning
   - always use UTC for time internally

4. API must NEVER return partial data:
   - either full APIResponse
   - or ErrorResponse (with error field always set)

5. call_ai() lives in ai_scorer.py, NOT here.
   Its signature is: call_ai(data: AIExplanationInput) -> str
   It returns a plain-English string only.
   On any failure it returns a fallback string — never raises to the caller.

6. All contracts are STRICT:
   - no extra keys
   - no missing keys
   - field names in this file are the single source of truth
"""