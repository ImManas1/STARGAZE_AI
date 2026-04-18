/**
 * contracts.js
 *
 * Mirrors contracts.py exactly for the frontend.
 * Import from here instead of typing raw strings anywhere in the UI.
 * If a field name changes in contracts.py, update it here too — nowhere else.
 *
 * This file contains NO logic. Only structure + constants.
 */

// =========================================================
// 1. API REQUEST CONTRACT (Frontend → Backend)
// =========================================================

// Field names for the POST /recommend request body
export const REQ_LAT    = "lat";
export const REQ_LON    = "lon";
export const REQ_TIME   = "time";      // ISO 8601 UTC e.g. "2026-04-18T22:00:00Z"
export const REQ_TARGET = "target";   // one of VALID_TARGETS

export const VALID_TARGETS = ["moon", "mars", "jupiter", "saturn"];


// =========================================================
// 2. FINAL API RESPONSE CONTRACT (Backend → Frontend)
// =========================================================

// Field names for reading the response JSON
export const FIELD_SCORE       = "score";        // int 0–100
export const FIELD_CONDITION   = "condition";    // one of CONDITIONS
export const FIELD_CONFIDENCE  = "confidence";   // [low, high] e.g. [68, 88]
export const FIELD_BEST_WINDOW = "best_window";  // "21:00–23:00" or null
export const FIELD_REASON      = "reason";       // plain-English string from AI
export const FIELD_OBJECTS     = "objects";      // array of CelestialObject
export const FIELD_ERROR       = "error";        // null on success, string on failure


// =========================================================
// 3. CELESTIAL OBJECT FIELDS
// =========================================================

export const OBJ_NAME         = "name";          // e.g. "Jupiter"
export const OBJ_ALTITUDE_DEG = "altitude_deg";  // float, degrees
export const OBJ_VISIBLE      = "visible";        // boolean


// =========================================================
// 4. CONDITION LABELS
// =========================================================

export const CONDITION_EXCELLENT = "Excellent";
export const CONDITION_GOOD      = "Good";
export const CONDITION_POOR      = "Poor";

export const CONDITIONS = [CONDITION_EXCELLENT, CONDITION_GOOD, CONDITION_POOR];


// =========================================================
// 5. CONFIDENCE LABELS
// =========================================================

export const CONFIDENCE_HIGH   = "High";
export const CONFIDENCE_MEDIUM = "Medium";
export const CONFIDENCE_LOW    = "Low";


// =========================================================
// 6. HELPER — build request body
// =========================================================
// Use this in api.js instead of constructing the object manually.
// Guarantees the request always matches Contract A.

export function buildRequest(lat, lon, time, target) {
  return {
    [REQ_LAT]:    lat,
    [REQ_LON]:    lon,
    [REQ_TIME]:   time,
    [REQ_TARGET]: target,
  };
}


// =========================================================
// 7. HELPER — check if response is an error
// =========================================================

export function isError(response) {
  return response[FIELD_ERROR] !== null && response[FIELD_ERROR] !== undefined;
}


// =========================================================
// SYSTEM RULES (DOCUMENTATION ONLY)
// =========================================================

/*
RULES:

1. confidence is a 2-element array [low, high], not a single number.
   Render as e.g. "Score: 74 (68–88)" or "74 ± 10".

2. best_window can be null — always null-check before rendering.

3. Always check isError(response) before reading any other field.
   On error, all fields except error may be null.

4. Never hardcode condition or confidence strings in components.
   Import CONDITION_* and CONFIDENCE_* from here.

5. objects can be an empty array — handle zero-item case in ObjectList.jsx.

6. time in the request must be ISO 8601 UTC.
   Use new Date().toISOString() for current time.
*/