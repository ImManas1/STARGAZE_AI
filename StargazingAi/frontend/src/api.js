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

const BACKEND_URL = 'http://127.0.0.1:8000/recommend';

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
      throw error
  }
}
