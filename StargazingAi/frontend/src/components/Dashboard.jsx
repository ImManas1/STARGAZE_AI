import React, { useState, useEffect, useRef } from 'react';
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
  ArrowUpRight,
  Send,
  Bot,
  User,
  X,
  MessageCircle
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

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'AI', text: "Hi! I'm Stargaze AI 🌌 Ask me anything about astronomy, planets, or tonight's best viewing conditions!" }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatLoading, chatOpen]);

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'You', text: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'AI', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'AI', text: '⚠️ Unable to reach the server. Please ensure the backend is running.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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

  useEffect(() => { handleSearch(); }, []);
  useEffect(() => { if (forecast) handleSearch(); }, [target]);

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
    <>
      {/* ── MAIN UI OVERLAY ── */}
      <div className="ui-container">

        {/* LEFT PANEL: Controls */}
        <div className="glass-panel animate-fade-in" style={{ width: '340px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', alignSelf: 'flex-start' }}>
          
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
                      borderColor: target === t ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
                      color: target === t ? 'var(--color-accent)' : 'white',
                      fontWeight: target === t ? 600 : 400,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* City Input */}
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
                <Calendar size={14} /> Date &amp; Time
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

        {/* RIGHT PANEL: Forecast only */}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', width: '370px', alignSelf: 'flex-start' }}>

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
            <div className="glass-panel animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Score */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
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
                <h3 style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                  <Info size={13} /> AI Analysis
                </h3>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
                  {forecast[FIELD_REASON]}
                </p>
              </div>

              {/* Best Window */}
              {forecast[FIELD_BEST_WINDOW] && (
                <div style={{ background: 'rgba(0, 210, 255, 0.08)', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>
                    Optimal Viewing Time
                  </span>
                  <span style={{ fontSize: '17px', fontWeight: 600 }}>
                    {forecast[FIELD_BEST_WINDOW]}
                  </span>
                </div>
              )}

              {/* Object List */}
              {forecast[FIELD_OBJECTS] && forecast[FIELD_OBJECTS].length > 0 && (
                <div>
                  <h3 style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>Target Info</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {forecast[FIELD_OBJECTS].map((obj, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                        <span style={{ fontWeight: 600 }}>{obj.name}</span>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <ArrowUpRight size={13} /> {obj.altitude_deg}°
                          </span>
                          <span style={{ fontSize: '13px', display: 'flex', gap: '4px', alignItems: 'center', color: obj.visible ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                            <Eye size={13} /> {obj.visible ? 'Visible' : 'Not Visible'}
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

      {/* ── FLOATING CHATBOT (fixed bottom-right, outside flex layout) ── */}
      <div style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
        pointerEvents: 'auto',
      }}>

        {/* Expanded chat panel */}
        {chatOpen && (
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: '340px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,210,255,0.12)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,210,255,0.06)' }}>
              <Bot size={18} color="var(--color-accent)" />
              <span style={{ fontWeight: 600, fontSize: '15px' }}>Stargaze Chat</span>
              <span style={{
                marginLeft: '6px', width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                background: chatLoading ? '#ffca28' : '#00e676',
                boxShadow: chatLoading ? '0 0 6px #ffca28' : '0 0 6px #00e676'
              }} />
              <button
                onClick={() => setChatOpen(false)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >
                <X size={17} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ padding: '14px 14px', height: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.map((m, i) => {
                const isAI = m.sender === 'AI';
                return (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexDirection: isAI ? 'row' : 'row-reverse' }}>
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                      background: isAI ? 'rgba(0,210,255,0.18)' : 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isAI ? <Bot size={13} color="var(--color-accent)" /> : <User size={13} color="white" />}
                    </div>
                    <div style={{
                      maxWidth: '82%',
                      background: isAI ? 'rgba(0,210,255,0.07)' : 'rgba(255,255,255,0.06)',
                      border: isAI ? '1px solid rgba(0,210,255,0.14)' : '1px solid rgba(255,255,255,0.09)',
                      borderRadius: isAI ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                      padding: '8px 11px',
                      fontSize: '13px',
                      lineHeight: 1.55,
                      color: 'var(--color-text-primary)',
                    }}>
                      {m.text}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {chatLoading && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,210,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={13} color="var(--color-accent)" />
                  </div>
                  <div style={{ background: 'rgba(0,210,255,0.07)', border: '1px solid rgba(0,210,255,0.14)', borderRadius: '4px 12px 12px 12px', padding: '10px 14px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)', opacity: 0.7, animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '11px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about planets, sky events…"
                disabled={chatLoading}
                className="input-glass"
                style={{ flex: 1, fontSize: '13px', padding: '8px 11px', opacity: chatLoading ? 0.6 : 1 }}
              />
              <button
                onClick={sendMessage}
                disabled={chatLoading || !input.trim()}
                style={{
                  width: '34px', height: '34px', borderRadius: '50%', border: 'none',
                  cursor: chatLoading || !input.trim() ? 'not-allowed' : 'pointer',
                  background: chatLoading || !input.trim() ? 'rgba(0,210,255,0.15)' : 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'all 0.2s ease',
                  opacity: chatLoading || !input.trim() ? 0.45 : 1,
                }}
              >
                <Send size={14} color="white" />
              </button>
            </div>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setChatOpen(o => !o)}
          style={{
            width: '56px', height: '56px', borderRadius: '50%', border: 'none',
            background: chatOpen
              ? 'rgba(30,35,55,0.9)'
              : 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
            boxShadow: chatOpen
              ? '0 4px 20px rgba(0,0,0,0.4)'
              : '0 4px 24px rgba(0,210,255,0.45)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.25s ease',
            flexShrink: 0,
          }}
          title={chatOpen ? 'Close chat' : 'Open Stargaze Chat'}
        >
          {chatOpen
            ? <X size={22} color="rgba(255,255,255,0.7)" />
            : <MessageCircle size={24} color="white" />
          }
        </button>
      </div>
    </>
  );
}
