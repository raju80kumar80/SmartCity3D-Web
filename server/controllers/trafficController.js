import mongoose from 'mongoose';
import TrafficSignal from '../models/TrafficSignal.js';

let mockTrafficSignals = [
  { _id: 'mock_sig_1', junctionId: 'J-NORTH', name: 'North Boulevard Junction', status: 'GREEN', emergencyOverride: false, cycleDuration: 15, coordinates: { x: 0, z: -35 }, lastToggled: new Date() },
  { _id: 'mock_sig_2', junctionId: 'J-SOUTH', name: 'South Highway Junction', status: 'RED', emergencyOverride: false, cycleDuration: 15, coordinates: { x: 0, z: 35 }, lastToggled: new Date() },
  { _id: 'mock_sig_3', junctionId: 'J-EAST',  name: 'East Commercial Avenue', status: 'GREEN', emergencyOverride: false, cycleDuration: 15, coordinates: { x: 35, z: 0 }, lastToggled: new Date() },
  { _id: 'mock_sig_4', junctionId: 'J-WEST',  name: 'West Residential Gate', status: 'RED', emergencyOverride: false, cycleDuration: 15, coordinates: { x: -35, z: 0 }, lastToggled: new Date() }
];

/**
 * @route   GET /api/traffic
 * @desc    Get all traffic signals and statuses
 */
export const getTrafficSignals = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const signals = await TrafficSignal.find().sort({ junctionId: 1 });
      if (signals.length > 0) {
        return res.json({ success: true, count: signals.length, data: signals });
      }
    }
    return res.json({ success: true, count: mockTrafficSignals.length, data: mockTrafficSignals });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/traffic/:junctionId/status
 * @desc    Change signal status (RED, YELLOW, GREEN)
 */
export const updateSignalStatus = async (req, res, next) => {
  try {
    const { junctionId } = req.params;
    const { status } = req.body;

    if (!['RED', 'YELLOW', 'GREEN'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be RED, YELLOW, or GREEN' });
    }

    if (mongoose.connection.readyState === 1) {
      const signal = await TrafficSignal.findOne({ junctionId: junctionId.toUpperCase() });
      if (!signal) {
        return res.status(404).json({ success: false, message: `Junction ${junctionId} not found` });
      }

      signal.status = status;
      signal.lastToggled = new Date();
      await signal.save();

      return res.json({ success: true, data: signal });
    } else {
      const signal = mockTrafficSignals.find(s => s.junctionId === junctionId.toUpperCase());
      if (!signal) {
        return res.status(404).json({ success: false, message: `Junction ${junctionId} not found` });
      }

      signal.status = status;
      signal.lastToggled = new Date();

      return res.json({ success: true, mode: 'in-memory', data: signal });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/traffic/emergency-override
 * @desc    Trigger Green Corridor / Emergency Override across city signals
 */
export const setEmergencyOverride = async (req, res, next) => {
  try {
    const { enable } = req.body;
    const overrideStatus = Boolean(enable);

    if (mongoose.connection.readyState === 1) {
      await TrafficSignal.updateMany({}, {
        emergencyOverride: overrideStatus,
        status: overrideStatus ? 'GREEN' : 'RED',
        lastToggled: new Date()
      });

      const updated = await TrafficSignal.find();
      return res.json({
        success: true,
        message: `Emergency Corridor ${overrideStatus ? 'ACTIVATED (All Signals Green)' : 'DEACTIVATED'}`,
        data: updated
      });
    } else {
      mockTrafficSignals.forEach(s => {
        s.emergencyOverride = overrideStatus;
        s.status = overrideStatus ? 'GREEN' : 'RED';
        s.lastToggled = new Date();
      });

      return res.json({
        success: true,
        mode: 'in-memory',
        message: `Emergency Corridor ${overrideStatus ? 'ACTIVATED' : 'DEACTIVATED'}`,
        data: mockTrafficSignals
      });
    }
  } catch (error) {
    next(error);
  }
};
