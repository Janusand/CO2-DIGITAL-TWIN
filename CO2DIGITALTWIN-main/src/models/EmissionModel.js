// src/models/EmissionModel.js

/**
 * Handles calculations related to CO₂ emissions from various sources.
 */
class EmissionModel {
  // Emission factors in kg CO₂ per unit (e.g., per vehicle-km)
  static FACTORS = {
    car: 0.12,     // kg CO₂ per km
    truck: 0.35,   // kg CO₂ per km
    bus: 0.28,     // kg CO₂ per km
    industry: 1.5, // kg CO₂ per hour (example factor)
    commercial: 0.8 // kg CO₂ per hour (example factor)
  };

  /**
   * Calculates total emissions from a list of sources.
   * @param {Array} sources - Array of emission source objects.
   * @returns {Number} Total emission rate in kg/s.
   */
  static calculateTotalEmissions(sources) {
    if (!sources || sources.length === 0) {
      return 0;
    }

    const totalEmission = sources.reduce((sum, source) => {
      // Assuming emission_rate is given in kg/hour, convert to kg/s
      return sum + (source.emission_rate / 3600);
    }, 0);

    return totalEmission;
  }
}

export default EmissionModel;