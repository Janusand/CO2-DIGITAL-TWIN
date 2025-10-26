// src/components/HeatmapOverlay.js
import React, { useRef, useEffect, useMemo, useState } from 'react';

const HeatmapOverlay = ({ grid }) => {
  const canvasRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  const { min, max } = useMemo(() => {
    if (!grid || grid.length === 0) return { min: 0, max: 0 };
    let minVal = Infinity;
    let maxVal = -Infinity;
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell < minVal) minVal = cell;
        if (cell > maxVal) maxVal = cell;
      });
    });
    return { min: minVal, max: maxVal || 1 };
  }, [grid]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const gridSize = grid.length;
    if (gridSize === 0) return;

    const canvasSize = canvas.width;
    const cellSize = canvasSize / gridSize;
    
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const concentration = grid[y][x];
        const normalized = (concentration - min) / (max - min);
        const hue = (1 - normalized) * 240;
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.7)`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }, [grid, min, max]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const gridSize = grid.length;
      const cellSize = canvas.width / gridSize;
      const gridX = Math.floor(x / cellSize);
      const gridY = Math.floor(y / cellSize);
      if (grid[gridY] && grid[gridY][gridX] !== undefined) {
        setHoverInfo({
          x: event.clientX + 15,
          y: event.clientY,
          value: grid[gridY][gridX]
        });
      }
    };
    const handleMouseLeave = () => setHoverInfo(null);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [grid]);

  const legendStops = [
    { name: 'Min', value: min },
    { name: '', value: min + (max - min) * 0.25 },
    { name: 'Medium', value: min + (max - min) * 0.5 },
    { name: '', value: min + (max - min) * 0.75 },
    { name: 'Max', value: max }
  ];

  return (
    <div style={{ position: 'relative', width: 'fit-content', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '10px', fontFamily: 'sans-serif' }}>CO₂ Concentration Heatmap (kg/m³)</h3>
      <canvas ref={canvasRef} width="500" height="500" style={{ backgroundColor: '#ccc', cursor: 'crosshair' }} />
      
      <div style={{ marginTop: '15px', fontFamily: 'sans-serif', fontSize: '14px' }}>
        <div style={{
          height: '20px',
          borderRadius: '4px',
          background: 'linear-gradient(to right, hsl(240, 100%, 50%), hsl(180, 100%, 50%), hsl(120, 100%, 50%), hsl(60, 100%, 50%), hsl(0, 100%, 50%))'
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', padding: '0 5px' }}>
          {legendStops.map((stop, index) => (
            <div key={index} style={{ transform: 'translateX(-50%)', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{stop.value.toExponential(1)}</span>
              <br/>
              <span style={{ fontSize: '10px', color: '#666' }}>{stop.name}</span>
            </div>
          ))}
        </div>
      </div>

      {hoverInfo && (
         <div style={{
          position: 'fixed', top: `${hoverInfo.y}px`, left: `${hoverInfo.x}px`,
          background: 'rgba(0, 0, 0, 0.8)', color: 'white',
          padding: '8px 12px', borderRadius: '4px', fontSize: '14px',
          pointerEvents: 'none', transform: 'translateY(-100%)'
        }}>
          Value: {hoverInfo.value.toExponential(2)} kg/m³
        </div>
      )}
    </div>
  );
};

export default HeatmapOverlay;