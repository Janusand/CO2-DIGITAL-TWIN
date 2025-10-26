// src/utils/calculations.js

/**
 * General mathematical helper functions.
 */
class Calculations {
  /**
   * Converts Latitude/Longitude to simplified XY meters (Equirectangular projection).
   * This is a simplified conversion and not accurate for large areas.
   * @param {Number} lat - Latitude.
   * @param {Number} lon - Longitude.
   * @param {Number} centerLat - Latitude of the map's center.
   * @returns {{x: Number, y: Number}}
   */
  static latLonToMeters(lat, lon, centerLat) {
    const R = 6371e3; // Earth radius in meters
    const x = R * (lon * Math.PI / 180) * Math.cos(centerLat * Math.PI / 180);
    const y = R * (lat * Math.PI / 180);
    return { x, y };
  }
}

export default Calculations;