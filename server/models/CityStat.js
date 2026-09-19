import mongoose from 'mongoose';

const cityStatSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now
    },
    powerConsumptionKw: {
      type: Number,
      default: 1250 // Kilowatts
    },
    activeVehicles: {
      type: Number,
      default: 48
    },
    airQualityIndex: {
      type: Number,
      default: 42 // Good AQI range
    },
    totalParkingSlots: {
      type: Number,
      default: 8
    },
    occupiedParkingSlots: {
      type: Number,
      default: 3
    },
    waterConsumptionLiters: {
      type: Number,
      default: 8200
    },
    renewableEnergyPercentage: {
      type: Number,
      default: 68 // % solar/clean energy
    }
  },
  {
    timestamps: true
  }
);

const CityStat = mongoose.model('CityStat', cityStatSchema);
export default CityStat;
