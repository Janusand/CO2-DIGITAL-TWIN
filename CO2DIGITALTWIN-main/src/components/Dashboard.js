// src/components/Dashboard.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = ({ sources, totalEmissions, totalCapture }) => {
  // Data for emission sources by category
  const emissionByCategory = sources.reduce((acc, source) => {
    const category = source.category || 'unknown';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += source.emission_rate;
    return acc;
  }, {});
  
  const pieData = Object.keys(emissionByCategory).map(key => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: emissionByCategory[key]
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const summaryData = [
    { name: 'Total Emission (kg/hr)', value: (totalEmissions * 3600).toFixed(2) },
    { name: 'Total Capture (kg/hr)', value: (totalCapture * 3600).toFixed(2) },
    { name: 'Net Emission (kg/hr)', value: ((totalEmissions - totalCapture) * 3600).toFixed(2) }
  ];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={summaryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label>
            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Dashboard;