import mongoose from 'mongoose';

const emergencyIncidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    type: {
      type: String,
      enum: ['FIRE', 'AMBULANCE', 'POLICE'],
      required: [true, 'Incident type is required']
    },
    locationName: {
      type: String,
      required: true
    },
    coordinates: {
      x: { type: Number, required: true },
      z: { type: Number, required: true }
    },
    description: {
      type: String,
      default: 'Emergency reported'
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH'
    },
    status: {
      type: String,
      enum: ['REPORTED', 'DISPATCHED', 'RESOLVED'],
      default: 'REPORTED'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    dispatchedAt: {
      type: Date
    },
    resolvedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const EmergencyIncident = mongoose.model('EmergencyIncident', emergencyIncidentSchema);
export default EmergencyIncident;
