import React, { useState } from 'react';
import Scene from './components/Scene.jsx';
import Dashboard from './components/Dashboard.jsx';

function App() {
  const [target, setTarget] = useState('jupiter');

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Scene target={target} setTarget={setTarget} />
      <Dashboard target={target} setTarget={setTarget} />
    </div>
  );
}

export default App;
