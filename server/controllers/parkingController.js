import mongoose from 'mongoose';
import ParkingSlot from '../models/ParkingSlot.js';

// Initial parking slot definitions (matching 3D city coordinates)
let mockParkingSlots = [
  { _id: 'mock_p1', slotCode: 'P-01', zone: 'North Plaza', isOccupied: false, vehicleNumber: '', coordinates: { x: -25, z: -25 }, lastUpdated: new Date() },
  { _id: 'mock_p2', slotCode: 'P-02', zone: 'North Plaza', isOccupied: true,  vehicleNumber: 'KA-01-AB-1234', coordinates: { x: -20, z: -25 }, lastUpdated: new Date() },
  { _id: 'mock_p3', slotCode: 'P-03', zone: 'North Plaza', isOccupied: false, vehicleNumber: '', coordinates: { x: -15, z: -25 }, lastUpdated: new Date() },
  { _id: 'mock_p4', slotCode: 'P-04', zone: 'North Plaza', isOccupied: true,  vehicleNumber: 'MH-02-CD-5678', coordinates: { x: -10, z: -25 }, lastUpdated: new Date() },
  { _id: 'mock_p5', slotCode: 'P-05', zone: 'South Commercial', isOccupied: false, vehicleNumber: '', coordinates: { x: 10, z: 25 }, lastUpdated: new Date() },
  { _id: 'mock_p6', slotCode: 'P-06', zone: 'South Commercial', isOccupied: false, vehicleNumber: '', coordinates: { x: 15, z: 25 }, lastUpdated: new Date() },
  { _id: 'mock_p7', slotCode: 'P-07', zone: 'South Commercial', isOccupied: true,  vehicleNumber: 'DL-04-EF-9012', coordinates: { x: 20, z: 25 }, lastUpdated: new Date() },
  { _id: 'mock_p8', slotCode: 'P-08', zone: 'South Commercial', isOccupied: false, vehicleNumber: '', coordinates: { x: 25, z: 25 }, lastUpdated: new Date() }
];

/**
 * @route   GET /api/parking
 * @desc    Get all parking slots and their real-time status
 */
export const getParkingSlots = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const slots = await ParkingSlot.find().sort({ slotCode: 1 });
      if (slots.length > 0) {
        return res.json({ success: true, count: slots.length, data: slots });
      }
    }
    // Fallback if DB empty or offline
    return res.json({ success: true, count: mockParkingSlots.length, data: mockParkingSlots });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/parking/:slotCode/toggle
 * @desc    Quick toggle occupancy for 3D interaction / simulation
 */
export const toggleSlotOccupancy = async (req, res, next) => {
  try {
    const { slotCode } = req.params;

    if (mongoose.connection.readyState === 1) {
      const slot = await ParkingSlot.findOne({ slotCode: slotCode.toUpperCase() });
      if (!slot) {
        return res.status(404).json({ success: false, message: `Slot ${slotCode} not found` });
      }

      slot.isOccupied = !slot.isOccupied;
      if (!slot.isOccupied) {
        slot.vehicleNumber = '';
        slot.reservedBy = null;
      }
      slot.lastUpdated = new Date();
      await slot.save();

      return res.json({ success: true, data: slot });
    } else {
      const slot = mockParkingSlots.find(s => s.slotCode === slotCode.toUpperCase());
      if (!slot) {
        return res.status(404).json({ success: false, message: `Slot ${slotCode} not found` });
      }

      slot.isOccupied = !slot.isOccupied;
      if (!slot.isOccupied) {
        slot.vehicleNumber = '';
      }
      slot.lastUpdated = new Date();

      return res.json({ success: true, mode: 'in-memory', data: slot });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/parking/reserve
 * @desc    Citizen reserves an available parking slot
 */
export const reserveSlot = async (req, res, next) => {
  try {
    const { slotCode, vehicleNumber } = req.body;

    if (!slotCode) {
      return res.status(400).json({ success: false, message: 'Please specify slotCode to reserve' });
    }

    if (mongoose.connection.readyState === 1) {
      const slot = await ParkingSlot.findOne({ slotCode: slotCode.toUpperCase() });
      if (!slot) {
        return res.status(404).json({ success: false, message: 'Slot not found' });
      }
      if (slot.isOccupied) {
        return res.status(400).json({ success: false, message: 'Slot is already occupied' });
      }

      slot.isOccupied = true;
      slot.vehicleNumber = vehicleNumber || 'RESERVED';
      slot.reservedBy = req.user ? req.user._id : null;
      slot.lastUpdated = new Date();
      await slot.save();

      return res.json({ success: true, message: `Slot ${slotCode} reserved successfully`, data: slot });
    } else {
      const slot = mockParkingSlots.find(s => s.slotCode === slotCode.toUpperCase());
      if (!slot) {
        return res.status(404).json({ success: false, message: 'Slot not found' });
      }
      if (slot.isOccupied) {
        return res.status(400).json({ success: false, message: 'Slot is already occupied' });
      }

      slot.isOccupied = true;
      slot.vehicleNumber = vehicleNumber || 'RESERVED';
      slot.lastUpdated = new Date();

      return res.json({ success: true, mode: 'in-memory', message: `Slot ${slotCode} reserved`, data: slot });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/parking/release
 * @desc    Release an occupied parking slot
 */
export const releaseSlot = async (req, res, next) => {
  try {
    const { slotCode } = req.body;

    if (!slotCode) {
      return res.status(400).json({ success: false, message: 'Please specify slotCode' });
    }

    if (mongoose.connection.readyState === 1) {
      const slot = await ParkingSlot.findOne({ slotCode: slotCode.toUpperCase() });
      if (!slot) {
        return res.status(404).json({ success: false, message: 'Slot not found' });
      }

      slot.isOccupied = false;
      slot.vehicleNumber = '';
      slot.reservedBy = null;
      slot.lastUpdated = new Date();
      await slot.save();

      return res.json({ success: true, message: `Slot ${slotCode} released`, data: slot });
    } else {
      const slot = mockParkingSlots.find(s => s.slotCode === slotCode.toUpperCase());
      if (!slot) {
        return res.status(404).json({ success: false, message: 'Slot not found' });
      }

      slot.isOccupied = false;
      slot.vehicleNumber = '';
      slot.lastUpdated = new Date();

      return res.json({ success: true, mode: 'in-memory', message: `Slot ${slotCode} released`, data: slot });
    }
  } catch (error) {
    next(error);
  }
};
