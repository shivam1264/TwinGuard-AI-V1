import React from 'react';
import ReactDOM from 'react-dom/client';
import { EmergencyCommandCenterPage } from './components/EmergencyCommandCenterPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <div style={{ position: 'fixed', inset: 0 }}>
    <EmergencyCommandCenterPage />
  </div>
);
