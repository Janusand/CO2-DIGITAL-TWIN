// src/models/DispersionModel.js

/**
 * Implements a simplified Gaussian plume model for pollutant dispersion.
 */
class DispersionModel {
  /**
   * Generates a 2D grid of pollutant concentrations.
   * @param {Array} sources - Emission sources.
   * @param {Number} gridSize - The dimension of the grid (e.g., 50 for a 50x50 grid).
   * @param {Number} cellSize - The real-world size of each grid cell in meters.
   * @param {Number} windSpeed - Wind speed in m/s.
   * @param {String} stabilityClass - Pasquill stability class (A-F).
   * @returns {Array<Array<Number>>} A 2D array representing the concentration grid.
   */
  static generateConcentrationGrid(sources, gridSize, cellSize, windSpeed, stabilityClass) {
    const grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    if (windSpeed === 0) windSpeed = 0.1; // Avoid division by zero

    sources.forEach(source => {
      const q = source.emission_rate / 3600; // Emission rate in kg/s
      const h = source.height || 20; // Effective stack height in meters

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const x = j * cellSize; // downwind distance
          const y = (i - gridSize / 2) * cellSize; // crosswind distance

          // Skip calculations for upwind points
          if (x < 0) continue;

          // Pasquill-Gifford dispersion parameters (simplified)
          const { sigmaY, sigmaZ } = this.getSigma(x, stabilityClass);
          
          // Gaussian Plume Equation for ground-level concentration (z=0)
          const term1 = q / (Math.PI * windSpeed * sigmaY * sigmaZ);
          const term2 = Math.exp(-0.5 * (y / sigmaY) ** 2);
          const term3 = Math.exp(-0.5 * (h / sigmaZ) ** 2);

          const concentration = term1 * term2 * term3; // in kg/m^3
          
          // Assume source is at the center of the grid for this model
          const sourceGridX = Math.round(source.x / cellSize);
          const sourceGridY = Math.round(source.y / cellSize);

          const gridX = j;
          const gridY = i;

          if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
             grid[gridY][gridX] += concentration;
          }
        }
      }
    });

    return grid;
  }

  /**
   * Provides dispersion coefficients based on distance and stability class.
   * These are simplified power-law approximations.
   * @param {Number} x - Downwind distance in meters.
   * @param {String} stabilityClass - (A, B, C, D, E, F).
   * @returns {{sigmaY: Number, sigmaZ: Number}}
   */
  static getSigma(x, stabilityClass) {
    // Coefficients for urban areas
    const params = {
      A: { ay: 0.32, by: 0.71, az: 0.24, bz: 0.9 },
      B: { ay: 0.22, by: 0.71, az: 0.20, bz: 0.9 },
      C: { ay: 0.16, by: 0.71, az: 0.14, bz: 0.9 },
      D: { ay: 0.11, by: 0.71, az: 0.08, bz: 0.9 },
      E: { ay: 0.08, by: 0.71, az: 0.06, bz: 0.9 },
      F: { ay: 0.06, by: 0.71, az: 0.04, bz: 0.9 },
    };
    const p = params[stabilityClass] || params['D']; // Default to neutral
    const sigmaY = p.ay * x ** p.by;
    const sigmaZ = p.az * x ** p.bz;
    return { sigmaY, sigmaZ };
  }
}

export default DispersionModel;