import mongoose from 'mongoose';
import EnvironmentSensor from '../models/EnvironmentSensor.js';

// Fallback in-memory environment sensors if MongoDB is offline or disconnected
let mockEnvironmentSensors = [
  {
    _id: 'mock_env_1',
    sensorId: 'ENV-01',
    name: 'Central Eco Park Station',
    zone: 'PARK',
    coordinates: { x: 22, z: 18 },
    temperature: 22.4,
    humidity: 64,
    aqi: 28,
    pm25: 8,
    pm10: 16,
    co2: 395,
    no2: 12,
    status: 'GOOD',
    ecoFilterActive: false,
    lastUpdated: new Date()
  },
  {
    _id: 'mock_env_2',
    sensorId: 'ENV-02',
    name: 'Commercial Financial District Station',
    zone: 'COMMERCIAL',
    coordinates: { x: 22, z: -22 },
    temperature: 26.8,
    humidity: 48,
    aqi: 72,
    pm25: 24,
    pm10: 45,
    co2: 480,
    no2: 28,
    status: 'MODERATE',
    ecoFilterActive: false,
    lastUpdated: new Date()
  },
  {
    _id: 'mock_env_3',
    sensorId: 'ENV-03',
    name: 'Tech & Innovation Park Station',
    zone: 'TECH',
    coordinates: { x: -22, z: -20 },
    temperature: 24.1,
    humidity: 52,
    aqi: 45,
    pm25: 14,
    pm10: 28,
    co2: 420,
    no2: 19,
    status: 'GOOD',
    ecoFilterActive: false,
    lastUpdated: new Date()
  },
  {
    _id: 'mock_env_4',
    sensorId: 'ENV-04',
    name: 'Residential Living District Station',
    zone: 'RESIDENTIAL',
    coordinates: { x: -20, z: 22 },
    temperature: 23.5,
    humidity: 58,
    aqi: 38,
    pm25: 11,
    pm10: 22,
    co2: 405,
    no2: 15,
    status: 'GOOD',
    ecoFilterActive: false,
    lastUpdated: new Date()
  },
  {
    _id: 'mock_env_5',
    sensorId: 'ENV-05',
    name: 'Central Traffic Hub Roundabout Station',
    zone: 'TRANSIT',
    coordinates: { x: 6, z: -6 },
    temperature: 27.5,
    humidity: 46,
    aqi: 118,
    pm25: 42,
    pm10: 78,
    co2: 540,
    no2: 36,
    status: 'UNHEALTHY',
    ecoFilterActive: false,
    lastUpdated: new Date()
  },
  {
    _id: 'mock_env_6',
    sensorId: 'ENV-06',
    name: 'West Gate Industrial Corridor Station',
    zone: 'INDUSTRIAL',
    coordinates: { x: -45, z: -10 },
    temperature: 25.2,
    humidity: 50,
    aqi: 68,
    pm25: 22,
    pm10: 41,
    co2: 460,
    no2: 24,
    status: 'MODERATE',
    ecoFilterActive: false,
    lastUpdated: new Date()
  }
];

/**
 * Calculates city-wide environmental summary from sensor array
 */
const calculateSummary = (sensors) => {
  if (!sensors || sensors.length === 0) {
    return {
      avgAqi: 45,
      avgTemperature: 24.0,
      avgHumidity: 55,
      primaryPollutant: 'PM2.5',
      highPollutionWarning: false,
      warningStation: null,
      ecoZoneHealth: 100
    };
  }

  const totalAqi = sensors.reduce((acc, s) => acc + (s.aqi || 0), 0);
  const totalTemp = sensors.reduce((acc, s) => acc + (s.temperature || 0), 0);
  const totalHumidity = sensors.reduce((acc, s) => acc + (s.humidity || 0), 0);
  const goodCount = sensors.filter(s => s.status === 'GOOD').length;

  const avgAqi = Math.round(totalAqi / sensors.length);
  const avgTemperature = +(totalTemp / sensors.length).toFixed(1);
  const avgHumidity = Math.round(totalHumidity / sensors.length);
  const ecoZoneHealth = Math.round((goodCount / sensors.length) * 100);

  const unhealthySensor = sensors.find(s => (s.aqi >= 100 || s.pm25 >= 35 || s.status === 'UNHEALTHY'));

  return {
    avgAqi,
    avgTemperature,
    avgHumidity,
    primaryPollutant: 'PM2.5',
    highPollutionWarning: Boolean(unhealthySensor),
    warningStation: unhealthySensor ? `${unhealthySensor.name} (${unhealthySensor.sensorId})` : null,
    warningAqi: unhealthySensor ? unhealthySensor.aqi : null,
    ecoZoneHealth
  };
};

/**
 * @route   GET /api/environment
 * @desc    Get all environmental monitoring stations and aggregate city eco metrics
 */
export const getEnvironmentSensors = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let sensors = await EnvironmentSensor.find().sort({ sensorId: 1 });
      if (sensors.length === 0) {
        // Auto-seed if database collection is empty
        sensors = await EnvironmentSensor.insertMany(mockEnvironmentSensors.map(s => {
          const { _id, ...rest } = s;
          return rest;
        }));
      }

      const summary = calculateSummary(sensors);
      return res.json({
        success: true,
        count: sensors.length,
        data: sensors,
        summary
      });
    }

    // In-memory fallback
    const summary = calculateSummary(mockEnvironmentSensors);
    return res.json({
      success: true,
      count: mockEnvironmentSensors.length,
      data: mockEnvironmentSensors,
      summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/environment/:sensorId
 * @desc    Get detailed atmospheric readings for a single sensor station
 */
export const getEnvironmentSensorById = async (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const targetId = sensorId.toUpperCase();

    if (mongoose.connection.readyState === 1) {
      const sensor = await EnvironmentSensor.findOne({ sensorId: targetId });
      if (!sensor) {
        return res.status(404).json({ success: false, message: `Sensor ${sensorId} not found` });
      }
      return res.json({ success: true, data: sensor });
    }

    const sensor = mockEnvironmentSensors.find(s => s.sensorId === targetId);
    if (!sensor) {
      return res.status(404).json({ success: false, message: `Sensor ${sensorId} not found` });
    }
    return res.json({ success: true, data: sensor });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/environment/:sensorId/eco-filter
 * @desc    Toggle active air purification / ecological mist mitigation for a station
 */
export const toggleEcoFilter = async (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const targetId = sensorId.toUpperCase();

    if (mongoose.connection.readyState === 1) {
      const sensor = await EnvironmentSensor.findOne({ sensorId: targetId });
      if (!sensor) {
        return res.status(404).json({ success: false, message: `Sensor ${sensorId} not found` });
      }

      sensor.ecoFilterActive = !sensor.ecoFilterActive;
      if (sensor.ecoFilterActive) {
        // Mitigation cleans pollutants
        sensor.aqi = Math.max(20, Math.round(sensor.aqi * 0.55));
        sensor.pm25 = Math.max(5, Math.round(sensor.pm25 * 0.5));
        sensor.pm10 = Math.max(10, Math.round(sensor.pm10 * 0.55));
        sensor.no2 = Math.max(8, Math.round(sensor.no2 * 0.6));
        sensor.humidity = Math.min(85, sensor.humidity + 6); // Mist adds mild humidity
        sensor.status = sensor.aqi <= 50 ? 'GOOD' : 'MODERATE';
      } else {
        // Revert to baseline ambient readings
        const baseline = mockEnvironmentSensors.find(s => s.sensorId === targetId);
        if (baseline) {
          sensor.aqi = baseline.aqi;
          sensor.pm25 = baseline.pm25;
          sensor.pm10 = baseline.pm10;
          sensor.no2 = baseline.no2;
          sensor.humidity = baseline.humidity;
          sensor.status = baseline.status;
        }
      }

      sensor.lastUpdated = new Date();
      await sensor.save();

      return res.json({
        success: true,
        message: `Eco-Filter ${sensor.ecoFilterActive ? 'ACTIVATED' : 'DEACTIVATED'} for ${sensor.sensorId}`,
        data: sensor
      });
    }

    // In-memory fallback
    const sensor = mockEnvironmentSensors.find(s => s.sensorId === targetId);
    if (!sensor) {
      return res.status(404).json({ success: false, message: `Sensor ${sensorId} not found` });
    }

    sensor.ecoFilterActive = !sensor.ecoFilterActive;
    if (sensor.ecoFilterActive) {
      sensor.aqi = Math.max(20, Math.round(sensor.aqi * 0.55));
      sensor.pm25 = Math.max(5, Math.round(sensor.pm25 * 0.5));
      sensor.pm10 = Math.max(10, Math.round(sensor.pm10 * 0.55));
      sensor.no2 = Math.max(8, Math.round(sensor.no2 * 0.6));
      sensor.humidity = Math.min(85, sensor.humidity + 6);
      sensor.status = sensor.aqi <= 50 ? 'GOOD' : 'MODERATE';
    } else {
      sensor.aqi = targetId === 'ENV-05' ? 118 : (targetId === 'ENV-02' ? 72 : (targetId === 'ENV-06' ? 68 : 35));
      sensor.pm25 = targetId === 'ENV-05' ? 42 : 14;
      sensor.pm10 = targetId === 'ENV-05' ? 78 : 28;
      sensor.no2 = targetId === 'ENV-05' ? 36 : 18;
      sensor.status = sensor.aqi <= 50 ? 'GOOD' : (sensor.aqi <= 100 ? 'MODERATE' : 'UNHEALTHY');
    }
    sensor.lastUpdated = new Date();

    return res.json({
      success: true,
      message: `Eco-Filter ${sensor.ecoFilterActive ? 'ACTIVATED' : 'DEACTIVATED'} for ${sensor.sensorId}`,
      data: sensor
    });
  } catch (error) {
    next(error);
  }
};
