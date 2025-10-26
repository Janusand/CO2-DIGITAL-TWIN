// src/App.js
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import CityVisualization3D from './components/CityVisualization3D';
import Dashboard from './components/Dashboard';
import HeatmapOverlay from './components/HeatmapOverlay';
import InterventionPanel from './components/InterventionPanel';
import EmissionModel from './models/EmissionModel';
import DispersionModel from './models/DispersionModel';
import CaptureModel from './models/CaptureModel';

// --- STYLES (with new styles for the legend) ---
const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw' },
  mainContent: { flex: 3, position: 'relative' },
  sidebar: { flex: 1, backgroundColor: '#fff', padding: '20px', overflowY: 'auto', borderLeft: '1px solid #ddd' },
  tabs: { position: 'absolute', top: 10, left: 10, zIndex: 1, backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '5px', borderRadius: '5px' },
  tabButton: { padding: '10px 15px', border: 'none', background: 'transparent', cursor: 'pointer' },
  activeTab: { fontWeight: 'bold', borderBottom: '2px solid #007bff' },
  controlGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '5px' },
  slider: { width: '100%' },
  legend: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    backgroundColor: 'rgba(40, 40, 40, 0.85)',
    color: 'white',
    padding: '15px',
    borderRadius: '8px',
    zIndex: 10,
    fontFamily: 'sans-serif',
    fontSize: '14px',
    minWidth: '250px'
  },
  legendTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    borderBottom: '1px solid #555',
    paddingBottom: '5px'
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('3D');
  const [emissionSources, setEmissionSources] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [windSpeed, setWindSpeed] = useState(5);
  const [stabilityClass, setStabilityClass] = useState('C');

  useEffect(() => {
    const fetchAndParseData = async () => {
      const response = await fetch('/emission_sources_data.csv');
      const csvText = await response.text();
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        complete: (result) => {
          const formattedData = result.data.map(row => ({
            ...row,
            x: parseFloat(row.x) || 0,
            y: parseFloat(row.y) || 0,
            emission_rate: parseFloat(row.emission_rate) || 0,
            height: parseInt(row.height, 10) || 0
          })).filter(row => row.name); // Filter out any empty rows
          setEmissionSources(formattedData);
        },
      });
    };
    fetchAndParseData();
  }, []);

  const { minEmission, maxEmission } = useMemo(() => {
    if (emissionSources.length === 0) return { minEmission: 0, maxEmission: 0 };
    const rates = emissionSources.map(s => s.emission_rate);
    return {
        minEmission: Math.min(...rates),
        maxEmission: Math.max(...rates)
    };
  }, [emissionSources]);

  const simulationGrid = useMemo(() => {
    return DispersionModel.generateConcentrationGrid(emissionSources, 50, 24, windSpeed, stabilityClass);
  }, [emissionSources, windSpeed, stabilityClass]);

  const totalEmissions = useMemo(() => EmissionModel.calculateTotalEmissions(emissionSources), [emissionSources]);
  
  const totalCapture = useMemo(() => {
    return CaptureModel.calculateTotalCapture(interventions, simulationGrid, 24);
  }, [interventions, simulationGrid]);

  const handleAddIntervention = (intervention) => {
    setInterventions(prev => [...prev, intervention]);
  };
  
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Heatmap':
        return <HeatmapOverlay grid={simulationGrid} />;
      case 'Analytics':
        return <Dashboard sources={emissionSources} totalEmissions={totalEmissions} totalCapture={totalCapture} />;
      case 'Interventions':
        return <InterventionPanel interventions={interventions} onAddIntervention={handleAddIntervention} />;
      case '3D':
      default:
        return <CityVisualization3D sources={emissionSources} interventions={interventions} />;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainContent}>
        <div style={styles.tabs}>
          {['3D', 'Heatmap', 'Analytics', 'Interventions'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...styles.tabButton, ...(activeTab === tab ? styles.activeTab : {}) }}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === '3D' && emissionSources.length > 0 && (
          <div style={styles.legend}>
            <h4 style={styles.legendTitle}>Emission Rate (kg/hr)</h4>
            <div style={{
              height: '20px', borderRadius: '4px',
              background: 'linear-gradient(to right, #48bb78, #f6e05e, #f56565)'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '12px' }}>
              <span>{minEmission.toFixed(1)} (Low)</span>
              <span>{((minEmission + maxEmission) / 2).toFixed(1)}</span>
              <span>{maxEmission.toFixed(1)} (High)</span>
            </div>
          </div>
        )}
        
        {renderActiveTab()}
      </div>
      <div style={styles.sidebar}>
        <h1>CO₂ Digital Twin</h1>
        <hr style={{ margin: '20px 0' }} />
        
        <div style={styles.controlGroup}>
          <h3>Simulation Controls</h3>
          <label htmlFor="windSpeed" style={styles.label}>Wind Speed: {windSpeed} m/s</label>
          <input
            type="range" id="windSpeed" min="0.1" max="20" step="0.1"
            value={windSpeed} onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
            style={styles.slider}
          />
        </div>
        
        <div style={styles.controlGroup}>
          <label htmlFor="stability" style={styles.label}>Atmospheric Stability:</label>
          <select
            id="stability" value={stabilityClass} onChange={(e) => setStabilityClass(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="A">A - Very Unstable</option>
            <option value="B">B - Unstable</option>
            <option value="C">C - Slightly Unstable</option>
            <option value="D">D - Neutral</option>
            <option value="E">E - Slightly Stable</option>
            <option value="F">F - Stable</option>
          </select>
        </div>

        <div style={styles.controlGroup}>
            <h3>Live Stats</h3>
            <p>Total Emission: {(totalEmissions * 3600).toFixed(2)} kg/hr</p>
            <p>Total Capture: {(totalCapture * 3600).toFixed(2)} kg/hr</p>
            <p><strong>Net Emission: {((totalEmissions - totalCapture) * 3600).toFixed(2)} kg/hr</strong></p>
        </div>
      </div>
    </div>
  );
}

export default App;