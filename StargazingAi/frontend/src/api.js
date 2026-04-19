import {
  buildRequest,
  isError,
  FIELD_SCORE,
  FIELD_CONDITION,
  FIELD_BEST_WINDOW,
  FIELD_CONF_BAND,
  FIELD_FORECAST_CONF,
  FIELD_REASON,
  FIELD_OBJECTS,
  CONDITION_GOOD,
  CONFIDENCE_HIGH,
  OBJ_NAME,
  OBJ_ALTITUDE_DEG,
  OBJ_VISIBLE,
} from './contracts.js';

const BACKEND_URL = 'http://localhost:5000/api/forecast';

/**
 * Fetches the forecast for a given target, city, and datetime.
 * If the backend is not available, returns mock data for demonstration.
 */
export async function fetchForecast(city, datetime, target) {
  const reqBody = buildRequest(city, datetime, target);

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (isError(data)) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.warn("Backend fetch failed, using mock data for 3D Demo purposes:", error);
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));

    // Return mocked data conforming to contracts.js
    return {
      [FIELD_SCORE]: Math.floor(Math.random() * 40) + 50, // 50-90
      [FIELD_CONF_BAND]: 12,
      [FIELD_CONDITION]: CONDITION_GOOD,
      [FIELD_BEST_WINDOW]: "22:00–01:00",
      [FIELD_FORECAST_CONF]: CONFIDENCE_HIGH,
      [FIELD_REASON]: "Clear skies and low atmospheric turbulence expected tonight. The target is well positioned above the horizon.",
      [FIELD_OBJECTS]: [
        {
          [OBJ_NAME]: target.charAt(0).toUpperCase() + target.slice(1),
          [OBJ_ALTITUDE_DEG]: 45.2,
          [OBJ_VISIBLE]: true,
        }
      ],
      error: null
    };
  }
}
