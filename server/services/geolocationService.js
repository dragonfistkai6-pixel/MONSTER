const axios = require('axios');
const { API_KEYS, APPROVED_ZONES } = require('../config/constants');

class GeolocationService {
  constructor() {
    this.openCellIdApiKey = API_KEYS.OPENCELLID;
    this.openCellIdUrl = 'https://us1.unwiredlabs.com/v2/process.php';
  }

  // Get location using browser geolocation API (frontend)
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Fallback location using OpenCellID API
  async getLocationByCellTower(cellData) {
    try {
      const requestData = {
        token: this.openCellIdApiKey,
        radio: cellData.radio || 'gsm',
        mcc: cellData.mcc,
        mnc: cellData.mnc,
        cells: [{
          lac: cellData.lac,
          cid: cellData.cid
        }]
      };

      const response = await axios.post(this.openCellIdUrl, requestData);
      
      if (response.data.status === 'ok') {
        return {
          success: true,
          latitude: response.data.lat.toString(),
          longitude: response.data.lon.toString(),
          accuracy: response.data.accuracy
        };
      } else {
        throw new Error(response.data.message || 'Location not found');
      }
    } catch (error) {
      console.error('Error getting location by cell tower:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Validate if coordinates are within approved harvesting zones
  validateHarvestingZone(latitude, longitude, zoneName) {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    // Define approximate boundaries for approved zones
    const zoneBoundaries = {
      'Himalayan Region - Uttarakhand': {
        minLat: 29.5, maxLat: 31.5, minLon: 78.0, maxLon: 81.0
      },
      'Western Ghats - Kerala': {
        minLat: 8.0, maxLat: 12.0, minLon: 76.0, maxLon: 77.5
      },
      'Eastern Ghats - Tamil Nadu': {
        minLat: 11.0, maxLat: 14.0, minLon: 78.0, maxLon: 80.5
      },
      'Central India - Madhya Pradesh': {
        minLat: 21.5, maxLat: 26.5, minLon: 74.0, maxLon: 82.5
      },
      'Northeast - Assam': {
        minLat: 24.0, maxLat: 28.0, minLon: 89.0, maxLon: 96.0
      },
      'Rajasthan Desert Region': {
        minLat: 24.0, maxLat: 30.0, minLon: 69.0, maxLon: 78.0
      },
      'Nilgiri Hills - Tamil Nadu': {
        minLat: 11.0, maxLat: 11.7, minLon: 76.3, maxLon: 77.0
      },
      'Aravalli Range - Rajasthan': {
        minLat: 24.0, maxLat: 28.0, minLon: 72.0, maxLon: 76.0
      },
      'Sahyadri Range - Maharashtra': {
        minLat: 15.0, maxLat: 20.0, minLon: 73.0, maxLon: 75.0
      },
      'Vindhya Range - Madhya Pradesh': {
        minLat: 23.0, maxLat: 25.5, minLon: 78.0, maxLon: 83.0
      }
    };

    const zone = zoneBoundaries[zoneName];
    if (!zone) {
      return {
        isValid: false,
        error: 'Unknown harvesting zone'
      };
    }

    const isWithinBounds = (
      lat >= zone.minLat && lat <= zone.maxLat &&
      lon >= zone.minLon && lon <= zone.maxLon
    );

    return {
      isValid: isWithinBounds,
      zone: zoneName,
      coordinates: { latitude: lat, longitude: lon },
      distance: isWithinBounds ? 0 : this.calculateDistanceToZone(lat, lon, zone)
    };
  }

  calculateDistanceToZone(lat, lon, zone) {
    // Calculate distance to nearest point in zone using Haversine formula
    const centerLat = (zone.minLat + zone.maxLat) / 2;
    const centerLon = (zone.minLon + zone.maxLon) / 2;
    
    return this.haversineDistance(lat, lon, centerLat, centerLon);
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Get address from coordinates using reverse geocoding
  async reverseGeocode(latitude, longitude) {
    try {
      // Using a free reverse geocoding service
      const response = await axios.get(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );

      if (response.data) {
        return {
          success: true,
          address: response.data.locality || response.data.city || 'Unknown',
          district: response.data.principalSubdivision || '',
          state: response.data.principalSubdivisionCode || '',
          country: response.data.countryName || ''
        };
      } else {
        throw new Error('No address found');
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error.message);
      return { 
        success: false, 
        error: error.message,
        address: 'Unknown Location'
      };
    }
  }

  getApprovedZones() {
    return APPROVED_ZONES;
  }

  // Validate coordinates format
  validateCoordinates(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return { isValid: false, error: 'Invalid coordinate format' };
    }

    if (lat < -90 || lat > 90) {
      return { isValid: false, error: 'Latitude must be between -90 and 90' };
    }

    if (lon < -180 || lon > 180) {
      return { isValid: false, error: 'Longitude must be between -180 and 180' };
    }

    return { isValid: true };
  }
}

module.exports = new GeolocationService();