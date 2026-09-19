import mongoose from 'mongoose';

/**
 * StreetLight Schema
 * Represents smart city street lighting nodes with adaptive brightness,
 * telemetry monitoring, energy conservation stats, and fault diagnostics.
 */
const streetLightSchema = new mongoose.Schema({
  lightId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  zone: {
    type: String,
    enum: ['COMMERCIAL', 'RESIDENTIAL', 'TECH', 'TRANSIT', 'PARK', 'INDUSTRIAL'],
    default: 'TRANSIT'
  },
  coordinates: {
    x: { type: Number, required: true },
    y: { type: Number, default: 0 },
    z: { type: Number, required: true },
    rotationY: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['ON', 'OFF', 'FAULT'],
    default: 'ON'
  },
  brightness: {
    type: Number,
    min: 0,
    max: 100,
    default: 80
  },
  mode: {
    type: String,
    enum: ['AUTO', 'MANUAL', 'ECO_RADAR'],
    default: 'AUTO'
  },
  lampType: {
    type: String,
    default: 'LED_SMART_LUMINAIRE'
  },
  powerRatingWatts: {
    type: Number,
    default: 120
  },
  energyConsumptionKWh: {
    type: Number,
    default: 1.42
  },
  energySavedPct: {
    type: Number,
    default: 35
  },
  isFaulty: {
    type: Boolean,
    default: false
  },
  faultType: {
    type: String,
    enum: ['NONE', 'DRIVER_FAULT', 'LED_BURNOUT', 'COMM_FAILURE', 'POWER_SURGE'],
    default: 'NONE'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const StreetLight = mongoose.model('StreetLight', streetLightSchema);
export default StreetLight;
