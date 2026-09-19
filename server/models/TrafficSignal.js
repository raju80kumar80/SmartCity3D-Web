import mongoose from 'mongoose';

const trafficSignalSchema = new mongoose.Schema(
  {
    junctionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['RED', 'YELLOW', 'GREEN'],
      default: 'GREEN'
    },
    emergencyOverride: {
      type: Boolean,
      default: false
    },
    cycleDuration: {
      type: Number,
      default: 15 // seconds
    },
    coordinates: {
      x: { type: Number, required: true },
      z: { type: Number, required: true }
    },
    lastToggled: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const TrafficSignal = mongoose.model('TrafficSignal', trafficSignalSchema);
export default TrafficSignal;
