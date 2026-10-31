import React from 'react';
import ReactDOM from 'react-dom/client';
import { EmergencyCommandCenterPage } from './components/EmergencyCommandCenterPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <div style={{ position: 'fixed', inset: 0 }}>
    <EmergencyCommandCenterPage
      onSwitchTo3D={() => {}}
      onClose={() => {}}
      onStartSimulation={() => {}}
      onPauseSimulation={() => {}}
      onTriggerFire={() => {}}
      onExtinguishFire={() => {}}
      onClearAllFires={() => {}}
      onUpdateRooms={() => {}}
      onUpdateExits={() => {}}
    />
  </div>
);
