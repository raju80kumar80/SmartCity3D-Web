import mongoose from 'mongoose';

/**
 * EnvironmentSensor Model
 * Stores real-time atmospheric and air quality telemetry for city zones.
 */
const environmentSensorSchema = new mongoose.Schema(
  {
    sensorId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    zone: {
      type: String,
      required: true,
      enum: ['PARK', 'COMMERCIAL', 'RESIDENTIAL', 'TECH', 'TRANSIT', 'INDUSTRIAL'],
      default: 'PARK'
    },
    coordinates: {
      x: {
        type: Number,
        required: true
      },
      z: {
        type: Number,
        required: true
      }
    },
    temperature: {
      type: Number,
      default: 24 // °C
    },
    humidity: {
      type: Number,
      default: 55 // %
    },
    aqi: {
      type: Number,
      default: 35 // 0 - 500
    },
    pm25: {
      type: Number,
      default: 12 // µg/m³
    },
    pm10: {
      type: Number,
      default: 22 // µg/m³
    },
    co2: {
      type: Number,
      default: 410 // ppm
    },
    no2: {
      type: Number,
      default: 18 // µg/m³
    },
    status: {
      type: String,
      enum: ['GOOD', 'MODERATE', 'UNHEALTHY', 'HAZARDOUS'],
      default: 'GOOD'
    },
    ecoFilterActive: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const EnvironmentSensor = mongoose.model('EnvironmentSensor', environmentSensorSchema);
export default EnvironmentSensor;
