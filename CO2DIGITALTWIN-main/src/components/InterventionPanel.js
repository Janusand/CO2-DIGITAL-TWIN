// src/components/InterventionPanel.js
import React from 'react';
import CaptureModel from '../models/CaptureModel';

const InterventionPanel = ({ interventions, onAddIntervention }) => {
  const handleAdd = (type) => {
    // For simplicity, add at a random location. In a real app, this would be from map clicks.
    const newIntervention = {
      id: Date.now(),
      type,
      x: Math.random() * 300,
      y: Math.random() * 300,
    };
    onAddIntervention(newIntervention);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Manage Interventions</h2>
      <div style={{ margin: '20px 0' }}>
        {Object.keys(CaptureModel.TECHNOLOGIES).map(key => (
          <button key={key} onClick={() => handleAdd(key)} style={{ marginRight: '10px', padding: '8px' }}>
            Add {CaptureModel.TECHNOLOGIES[key].name}
          </button>
        ))}
      </div>
      <h3>Placed Interventions:</h3>
      <ul style={{ listStyle: 'none' }}>
        {interventions.map(inter => (
          <li key={inter.id} style={{ padding: '5px', borderBottom: '1px solid #eee' }}>
            {CaptureModel.TECHNOLOGIES[inter.type]?.name} at ({Math.round(inter.x)}, {Math.round(inter.y)})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InterventionPanel;