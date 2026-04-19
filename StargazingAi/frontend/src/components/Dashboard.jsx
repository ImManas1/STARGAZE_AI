import React, { useState, useEffect } from 'react';
import { 
  Telescope, 
  MapPin, 
  Calendar, 
  Search, 
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  ArrowUpRight
} from 'lucide-react';
import { fetchForecast } from '../api.js';
import { 
  VALID_TARGETS, 
  FIELD_SCORE, 
  FIELD_CONDITION, 
  FIELD_BEST_WINDOW, 
  FIELD_REASON,
  FIELD_CONF_BAND,
  FIELD_OBJECTS,
  CONDITION_GOOD,
  CONDITION_MODERATE
} from '../contracts.js';

export default function Dashboard({ target, setTarget }) {
  const [city, setCity] = useState('Los Angeles');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const dt = new Date(date).toISOString();
      const data = await fetchForecast(city, dt, target);
      setForecast(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch forecast');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    handleSearch();
  }, []); // Run once on mount

  // Whenever target changes, we can optionally auto-fetch
  useEffect(() => {
    if (forecast) {
      handleSearch();
    }
  }, [target]);

  const getConditionColor = (condition) => {
    if (condition === CONDITION_GOOD) return 'var(--color-success)';
    if (condition === CONDITION_MODERATE) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getConditionIcon = (condition) => {
    if (condition === CONDITION_GOOD) return <CheckCircle2 size={24} color="var(--color-success)" />;
    if (condition === CONDITION_MODERATE) return <AlertTriangle size={24} color="var(--color-warning)" />;
    return <XCircle size={24} color="var(--color-danger)" />;
  };

  return (
    <div className="ui-container">
      {/* LEFT PANEL - Controls */}
      <div className="glass-panel animate-fade-in" style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
          <Telescope size={32} color="var(--color-accent)" />
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Stargaze AI</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Target Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Target Object</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {VALID_TARGETS.map(t => (
                <button 
                  key={t}
                  onClick={() => setTarget(t)}
                  className="input-glass"
                  style={{ 
                    flex: 1, 
                    cursor: 'pointer',
                    background: target === t ? 'rgba(0, 210, 255, 0.2)' : 'rgba(0,0,0,0.2)',
                    borderColor: target === t ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)'
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Location Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--color-text-secondary)', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <MapPin size={14} /> City
            </label>
            <input 
              type="text" 
              value={city} 
              onChange={e => setCity(e.target.value)}
              className="input-glass"
              placeholder="e.g. Los Angeles"
            />
          </div>

          {/* Date Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--color-text-secondary)', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Calendar size={14} /> Date & Time
            </label>
            <input 
              type="datetime-local" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="input-glass"
            />
          </div>

          <button onClick={handleSearch} className="btn-glass" style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
            {loading ? 'Scanning skies...' : <><Search size={18} /> Update Forecast</>}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL - Results (Only show if we have data) */}
      <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', width: '380px' }}>
        
        {error && (
          <div className="glass-panel animate-fade-in" style={{ padding: '20px', borderLeft: '4px solid var(--color-danger)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-danger)' }}>
              <AlertTriangle size={20} />
              <strong>Error</strong>
            </div>
            <p style={{ marginTop: '10px', fontSize: '14px' }}>{error}</p>
          </div>
        )}

        {forecast && !loading && !error && (
          <div className="glass-panel animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Header / Score */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '16px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  Visibility Score
                </h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '48px', fontWeight: 800, color: getConditionColor(forecast[FIELD_CONDITION]), lineHeight: 1 }}>
                    {forecast[FIELD_SCORE]}
                  </span>
                  <span style={{ fontSize: '18px', color: 'var(--color-text-secondary)' }}>
                    ± {forecast[FIELD_CONF_BAND]}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                {getConditionIcon(forecast[FIELD_CONDITION])}
                <span style={{ fontSize: '14px', fontWeight: 600, color: getConditionColor(forecast[FIELD_CONDITION]) }}>
                  {forecast[FIELD_CONDITION]}
                </span>
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

            {/* AI Reasoning */}
            <div>
              <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                <Info size={14} /> AI Analysis
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
                {forecast[FIELD_REASON]}
              </p>
            </div>

            {/* Best Window */}
            {forecast[FIELD_BEST_WINDOW] && (
              <div style={{ background: 'rgba(0, 210, 255, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>
                  Optimal Viewing Time
                </span>
                <span style={{ fontSize: '18px', fontWeight: 600 }}>
                  {forecast[FIELD_BEST_WINDOW]}
                </span>
              </div>
            )}

            {/* Target Details */}
            {forecast[FIELD_OBJECTS] && forecast[FIELD_OBJECTS].length > 0 && (
              <div>
                <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>Target Info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {forecast[FIELD_OBJECTS].map((obj, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 600 }}>{obj.name}</span>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <ArrowUpRight size={14} /> {obj.altitude_deg}°
                        </span>
                        <span style={{ fontSize: '14px', display: 'flex', gap: '4px', alignItems: 'center', color: obj.visible ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                          <Eye size={14} /> {obj.visible ? 'Visible' : 'Not Visible'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
