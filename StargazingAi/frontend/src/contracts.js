/**
 * contracts.js
 * ============
 * Mirrors contracts.py exactly for the frontend.
 * Teammate 3 (Frontend) owns this file.
 * Import from here — never type a field name as a raw string in components.
 *
 * RESOLVED FROM v1:
 * - Request field is "datetime" (not "time")
 * - Conditions are "Good" | "Moderate" | "Poor" (not Excellent)
 * - confidence_band is a single int (the ± value), not a tuple
 * - FIELD_FORECAST_CONF added (was missing)
 * - buildRequest() updated to use "datetime"
 * - isError() kept — use it before reading any other field
 *
 * This file contains NO logic. Only constants + two small helpers.
 */


// =========================================================
// 1. API REQUEST CONTRACT  (Frontend → Backend)
// =========================================================

export const REQ_CITY = "city"
export const REQ_DATETIME = "datetime";   // ISO 8601 UTC  e.g. "2026-04-18T22:00:00Z"
export const REQ_TARGET   = "target";     // one of VALID_TARGETS

export const VALID_TARGETS = ["moon", "mars", "jupiter", "saturn"];


// =========================================================
// 2. API RESPONSE CONTRACT  (Backend → Frontend)
// =========================================================

export const FIELD_SCORE         = "score";               // int 0–100
export const FIELD_CONF_BAND     = "confidence_band";     // int  e.g. 10  → display as "78 ± 10"
export const FIELD_CONDITION     = "condition";           // one of CONDITIONS
export const FIELD_BEST_WINDOW   = "best_window";         // "22:00–01:00" or null
export const FIELD_FORECAST_CONF = "forecast_confidence"; // one of CONFIDENCE_*
export const FIELD_REASON        = "reason";              // plain-English string from AI
export const FIELD_OBJECTS       = "objects";             // array of CelestialObject
export const FIELD_ERROR         = "error";               // null on success, string on failure


// =========================================================
// 3. CELESTIAL OBJECT FIELDS
// =========================================================

export const OBJ_NAME         = "name";          // e.g. "Jupiter"
export const OBJ_ALTITUDE_DEG = "altitude_deg";  // float, degrees above horizon
export const OBJ_VISIBLE      = "visible";        // boolean


// =========================================================
// 4. CONDITION LABELS
// =========================================================

export const CONDITION_GOOD     = "Good";
export const CONDITION_MODERATE = "Moderate";
export const CONDITION_POOR     = "Poor";

export const CONDITION_EXCELLENT = "Excellent";

export const CONDITIONS = [
  CONDITION_EXCELLENT,
  CONDITION_GOOD,
  CONDITION_MODERATE,
  CONDITION_POOR
];


// =========================================================
// 5. FORECAST CONFIDENCE LABELS
// =========================================================

export const CONFIDENCE_HIGH   = "High";    // forecast < 6 hours out
export const CONFIDENCE_MEDIUM = "Medium";  // forecast 6–24 hours out
export const CONFIDENCE_LOW    = "Low";     // forecast > 24 hours out

export const CONFIDENCE_LEVELS = [CONFIDENCE_HIGH, CONFIDENCE_MEDIUM, CONFIDENCE_LOW];


// =========================================================
// 6. HELPER — build request body
//    Use in api.js. Guarantees the request always matches Contract A.
// =========================================================

export function buildRequest(city, datetime, target) {
  return {
    [REQ_CITY]:city,
    [REQ_DATETIME]: datetime,   // pass new Date().toISOString() for current time
    [REQ_TARGET]:   target.toLowerCase(),
  };
}


// =========================================================
// 7. HELPER — check if response is an error
//    ALWAYS call this before reading any other field.
//    On error, every other field may be null.
// =========================================================

export function isError(response) {
  return response[FIELD_ERROR] !== null && response[FIELD_ERROR] !== undefined;
}


// =========================================================
// SYSTEM RULES  (documentation only)
// =========================================================

/*
RULES:

1.  confidence_band is a single int — the ± range.
    Render as: "78 ± 10"  where score=78 and confidence_band=10.
    It is NOT a tuple or array.

2.  best_window can be null — always null-check before rendering.
    null means the target is not visible in the next 12 hours.

3.  Always call isError(response) before reading any other field.
    On error, all fields except error may be null.

4.  Never hardcode condition or confidence strings in components.
    Import CONDITION_* and CONFIDENCE_* from here.

5.  objects can be an empty array — handle the zero-item case in ObjectList.jsx.

6.  datetime in the request must be ISO 8601 UTC.
    Use new Date().toISOString() for current time.

7.  Field names in contracts.py are the single source of truth.
    This file must mirror them exactly. If a name changes in contracts.py,
    update it here — and only here.
*/