// src/models/CaptureModel.js

/**
 * Models the effectiveness of different CO₂ capture technologies.
 */
class CaptureModel {
  static TECHNOLOGIES = {
    'direct_air_capture': {
      name: 'Direct Air Capture (DAC)',
      efficiency: 0.85, // Captures 85% of CO2 in its operational radius
      cost_per_ton: 600, // $600 per ton of CO2
      radius: 50, // Effective radius in meters
    },
    'afforestation': {
      name: 'Afforestation Zone',
      efficiency: 0.10, // Lower efficiency over a larger area
      cost_per_ton: 50,
      radius: 200,
    },
    'industrial_scrubber': {
      name: 'Industrial Scrubber',
      efficiency: 0.95, // Highly efficient at the source
      cost_per_ton: 100,
      radius: 20,
    }
  };

  /**
   * Calculates the total CO₂ captured by a set of interventions.
   * @param {Array} interventions - Array of intervention objects.
   * @param {Array<Array<Number>>} concentrationGrid - The CO₂ concentration grid.
   * @param {Number} cellSize - Size of a grid cell in meters.
   * @returns {Number} Total CO₂ captured in kg/s.
   */
  static calculateTotalCapture(interventions, concentrationGrid, cellSize) {
    let totalCaptured = 0;
    
    interventions.forEach(inter => {
      const tech = this.TECHNOLOGIES[inter.type];
      if (!tech) return;

      const gridX = Math.floor(inter.x / cellSize);
      const gridY = Math.floor(inter.y / cellSize);
      
      if (concentrationGrid[gridY] && concentrationGrid[gridY][gridX]) {
        const localConcentration = concentrationGrid[gridY][gridX]; // kg/m^3
        // Simplified: assumes capture affects a volume equal to cell area * 10m height
        const affectedVolume = cellSize * cellSize * 10; // m^3
        const availableCO2 = localConcentration * affectedVolume; // kg
        // Assuming capture rate is per second
        totalCaptured += availableCO2 * tech.efficiency; 
      }
    });

    return totalCaptured;
  }
}

export default CaptureModel;