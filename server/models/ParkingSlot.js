import mongoose from 'mongoose';

const parkingSlotSchema = new mongoose.Schema(
  {
    slotCode: {
      type: String,
      required: [true, 'Slot code is required (e.g. P-01)'],
      unique: true,
      trim: true,
      uppercase: true
    },
    zone: {
      type: String,
      required: true,
      default: 'Central District'
    },
    isOccupied: {
      type: Boolean,
      default: false
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    vehicleNumber: {
      type: String,
      default: ''
    },
    coordinates: {
      x: { type: Number, required: true },
      z: { type: Number, required: true }
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

const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);
export default ParkingSlot;
