import mongoose from 'mongoose';
import StreetLight from '../models/StreetLight.js';

/**
 * 16 Baseline Street Lights strictly mapped along city avenues and ring roads
 */
export let mockStreetLights = [
  // North-South Avenue (x=0, curbs at +/-6.8)
  {
    _id: 'mock_sl_1',
    lightId: 'SL-01',
    name: 'North-South Ave Luminaire 1',
    zone: 'COMMERCIAL',
    coordinates: { x: -7.5, y: 0, z: -60, rotationY: 0 },
    status: 'ON',
    brightness: 80,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.25,
    energySavedPct: 35,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  },
  {
    _id: 'mock_sl_2',
    lightId: 'SL-02',
    name: 'North-South Ave Luminaire 2',
    zone: 'COMMERCIAL',
    coordinates: { x: 7.5, y: 0, z: -40, rotationY: Math.PI },
    status: 'ON',
    brightness: 80,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.28,
    energySavedPct: 35,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  },
  {
    _id: 'mock_sl_3',
    lightId: 'SL-03',
    name: 'North-South Ave Luminaire 3',
    zone: 'TRANSIT',
    coordinates: { x: -7.5, y: 0, z: -20, rotationY: 0 },
    status: 'ON',
    brightness: 85,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.34,
    energySavedPct: 30,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  },
  {
    _id: 'mock_sl_4',
    lightId: 'SL-04',
    name: 'North-South Ave Luminaire 4',
    zone: 'TRANSIT',
    coordinates: { x: 7.5, y: 0, z: 20, rotationY: Math.PI },
    status: 'ON',
    brightness: 85,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.31,
    energySavedPct: 30,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  },
  {
    _id: 'mock_sl_5',
    lightId: 'SL-05',
    name: 'North-South Ave Luminaire 5',
    zone: 'RESIDENTIAL',
    coordinates: { x: -7.5, y: 0, z: 40, rotationY: 0 },
    status: 'ON',
    brightness: 75,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.18,
    energySavedPct: 40,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  },
  {
    _id: 'mock_sl_6',
    lightId: 'SL-06',
    name: 'North-South Ave Luminaire 6',
    zone: 'RESIDENTIAL',
    coordinates: { x: 7.5, y: 0, z: 60, rotationY: Math.PI },
    status: 'ON',
    brightness: 75,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.20,
    energySavedPct: 40,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  },

  // East-West Avenue (z=0, curbs at +/-6.8)
  {
    _id: 'mock_sl_7',
    lightId: 'SL-07',
    name: 'East-West Ave Luminaire 1',
    zone: 'TECH',
    coordinates: { x: -60, y: 0, z: -7.5, rotationY: Math.PI / 2 },
    status: 'ON',
    brightness: 80,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.26,
    energySavedPct: 35,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  },
  // SL-08 has the controlled diagnostic fault
  {
    _id: 'mock_sl_8',
    lightId: 'SL-08',
    name: 'East-West Ave Luminaire 2 (Faulty)',
    zone: 'TECH',
    coordinates: { x: -40, y: 0, z: 7.5, rotationY: -Math.PI / 2 },
    status: 'FAULT',
    brightness: 0,
    mode: 'MANUAL',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 0.15,
    energySavedPct: 90,
    isFaulty: true,
    faultType: 'DRIVER_FAULT',
    lastUpdated: new Date()
  },
  {
    _id: 'mock_sl_9',
    lightId: 'SL-09',
    name: 'East-West Ave Luminaire 3',
    zone: 'TRANSIT',
    coordinates: { x: -20, y: 0, z: -7.5, rotationY: Math.PI / 2 },
    status: 'ON',
    brightness: 85,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.35,
    energySavedPct: 30,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  },
  {
    _id: 'mock_sl_10',
    lightId: 'SL-10',
    name: 'East-West Ave Luminaire 4',
    zone: 'TRANSIT',
    coordinates: { x: 20, y: 0, z: 7.5, rotationY: -Math.PI / 2 },
    status: 'ON',
    brightness: 85,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.33,
    energySavedPct: 30,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  },
  {
    _id: 'mock_sl_11',
    lightId: 'SL-11',
    name: 'East-West Ave Luminaire 5',
    zone: 'PARK',
    coordinates: { x: 40, y: 0, z: -7.5, rotationY: Math.PI / 2 },
    status: 'ON',
    brightness: 70,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.12,
    energySavedPct: 45,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  },
  {
    _id: 'mock_sl_12',
    lightId: 'SL-12',
    name: 'East-West Ave Luminaire 6',
    zone: 'PARK',
    coordinates: { x: 60, y: 0, z: 7.5, rotationY: -Math.PI / 2 },
    status: 'ON',
    brightness: 70,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.10,
    energySavedPct: 45,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  },

  // Ring Road Intersections (x=+/-50, z=+/-50)
  {
    _id: 'mock_sl_13',
    lightId: 'SL-13',
    name: 'North-West Ring Intersection',
    zone: 'TECH',
    coordinates: { x: -44.5, y: 0, z: -50, rotationY: -Math.PI / 2 },
    status: 'ON',
    brightness: 80,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.22,
    energySavedPct: 35,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  },
  {
    _id: 'mock_sl_14',
    lightId: 'SL-14',
    name: 'North-East Ring Intersection',
    zone: 'COMMERCIAL',
    coordinates: { x: 44.5, y: 0, z: -50, rotationY: Math.PI / 2 },
    status: 'ON',
    brightness: 80,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.25,
    energySavedPct: 35,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  },
  {
    _id: 'mock_sl_15',
    lightId: 'SL-15',
    name: 'South-West Ring Intersection',
    zone: 'INDUSTRIAL',
    coordinates: { x: -44.5, y: 0, z: 50, rotationY: -Math.PI / 2 },
    status: 'ON',
    brightness: 80,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.24,
    energySavedPct: 35,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  },
  {
    _id: 'mock_sl_16',
    lightId: 'SL-16',
    name: 'South-East Ring Intersection',
    zone: 'PARK',
    coordinates: { x: 44.5, y: 0, z: 50, rotationY: Math.PI / 2 },
    status: 'ON',
    brightness: 75,
    mode: 'AUTO',
    lampType: 'LED_SMART_LUMINAIRE',
    powerRatingWatts: 120,
    energyConsumptionKWh: 1.15,
    energySavedPct: 40,
    isFaulty: false,
    faultType: 'NONE',
    lastUpdated: new Date()
  }
];

/**
 * Calculates city lighting summary metrics
 */
const calculateLightingSummary = (lights) => {
  if (!lights || lights.length === 0) {
    return {
      totalLights: 0,
      activeOnCount: 0,
      offCount: 0,
      faultyCount: 0,
      avgBrightness: 0,
      totalPowerKw: 0,
      energySavedPct: 0,
      systemMode: 'AUTO',
      faultAlert: false
    };
  }

  const totalLights = lights.length;
  const activeOnCount = lights.filter(l => l.status === 'ON').length;
  const offCount = lights.filter(l => l.status === 'OFF').length;
  const faultyCount = lights.filter(l => l.status === 'FAULT' || l.isFaulty).length;

  const totalBrightness = lights.reduce((acc, l) => acc + (l.status === 'ON' ? (l.brightness || 0) : 0), 0);
  const avgBrightness = activeOnCount > 0 ? Math.round(totalBrightness / activeOnCount) : 0;

  // Power in kW: sum of (powerRatingWatts * (brightness / 100)) for ON lights / 1000
  const totalWatts = lights.reduce((acc, l) => {
    if (l.status === 'ON') {
      return acc + ((l.powerRatingWatts || 120) * ((l.brightness || 80) / 100));
    }
    return acc;
  }, 0);
  const totalPowerKw = +(totalWatts / 1000).toFixed(2);

  // Energy saved % vs constant 100% illumination
  const maxPossibleWatts = totalLights * 120;
  const energySavedPct = maxPossibleWatts > 0
    ? Math.max(0, Math.round(((maxPossibleWatts - totalWatts) / maxPossibleWatts) * 100))
    : 0;

  return {
    totalLights,
    activeOnCount,
    offCount,
    faultyCount,
    avgBrightness,
    totalPowerKw,
    energySavedPct,
    systemMode: lights[0]?.mode || 'AUTO',
    faultAlert: faultyCount > 0,
    faultStationId: faultyCount > 0 ? (lights.find(l => l.isFaulty || l.status === 'FAULT')?.lightId || null) : null
  };
};

/**
 * @route   GET /api/street-lights
 * @desc    Get all 16 street lights and city lighting summary
 */
export const getStreetLights = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const lights = await StreetLight.find().sort({ lightId: 1 });
      if (lights.length > 0) {
        return res.json({
          success: true,
          count: lights.length,
          summary: calculateLightingSummary(lights),
          data: lights
        });
      }
    }

    // In-memory fallback
    return res.json({
      success: true,
      count: mockStreetLights.length,
      summary: calculateLightingSummary(mockStreetLights),
      data: mockStreetLights
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/street-lights/:lightId
 * @desc    Get single street light details
 */
export const getStreetLightById = async (req, res, next) => {
  try {
    const { lightId } = req.params;
    const targetId = lightId.toUpperCase();

    if (mongoose.connection.readyState === 1) {
      const light = await StreetLight.findOne({ lightId: targetId });
      if (!light) {
        return res.status(404).json({ success: false, message: `Street Light ${lightId} not found` });
      }
      return res.json({ success: true, data: light });
    }

    const light = mockStreetLights.find(l => l.lightId === targetId);
    if (!light) {
      return res.status(404).json({ success: false, message: `Street Light ${lightId} not found` });
    }
    return res.json({ success: true, data: light });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/street-lights/:lightId/status
 * @desc    Toggle light ON / OFF or reset fault
 */
export const toggleStreetLightStatus = async (req, res, next) => {
  try {
    const { lightId } = req.params;
    const { status, resetFault } = req.body;
    const targetId = lightId.toUpperCase();

    if (mongoose.connection.readyState === 1) {
      const light = await StreetLight.findOne({ lightId: targetId });
      if (!light) {
        return res.status(404).json({ success: false, message: `Street Light ${lightId} not found` });
      }

      if (resetFault) {
        light.isFaulty = false;
        light.faultType = 'NONE';
        light.status = 'ON';
        light.brightness = 80;
        light.mode = 'AUTO';
      } else if (status) {
        light.status = status;
        if (status === 'OFF') light.brightness = 0;
        if (status === 'ON' && light.brightness === 0) light.brightness = 80;
      } else {
        // Toggle
        light.status = light.status === 'ON' ? 'OFF' : 'ON';
        if (light.status === 'OFF') light.brightness = 0;
        if (light.status === 'ON' && light.brightness === 0) light.brightness = 80;
      }
      light.lastUpdated = new Date();
      await light.save();
      return res.json({ success: true, message: `Status updated for ${targetId}`, data: light });
    }

    // In-memory fallback
    const light = mockStreetLights.find(l => l.lightId === targetId);
    if (!light) {
      return res.status(404).json({ success: false, message: `Street Light ${lightId} not found` });
    }

    if (resetFault) {
      light.isFaulty = false;
      light.faultType = 'NONE';
      light.status = 'ON';
      light.brightness = 80;
      light.mode = 'AUTO';
    } else if (status) {
      light.status = status;
      if (status === 'OFF') light.brightness = 0;
      if (status === 'ON' && light.brightness === 0) light.brightness = 80;
    } else {
      light.status = light.status === 'ON' ? 'OFF' : 'ON';
      if (light.status === 'OFF') light.brightness = 0;
      if (light.status === 'ON' && light.brightness === 0) light.brightness = 80;
    }
    light.lastUpdated = new Date();

    return res.json({ success: true, message: `Status updated for ${targetId}`, data: light });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/street-lights/:lightId/brightness
 * @desc    Adjust brightness level (10 - 100%)
 */
export const updateStreetLightBrightness = async (req, res, next) => {
  try {
    const { lightId } = req.params;
    const { brightness } = req.body;
    const targetId = lightId.toUpperCase();

    const numericVal = parseInt(brightness, 10);
    if (isNaN(numericVal) || numericVal < 10 || numericVal > 100) {
      return res.status(400).json({
        success: false,
        message: 'Brightness must be an integer between 10 and 100.'
      });
    }

    if (mongoose.connection.readyState === 1) {
      const light = await StreetLight.findOne({ lightId: targetId });
      if (!light) {
        return res.status(404).json({ success: false, message: `Street Light ${lightId} not found` });
      }

      light.brightness = numericVal;
      light.status = 'ON';
      light.lastUpdated = new Date();
      await light.save();
      return res.json({ success: true, data: light });
    }

    const light = mockStreetLights.find(l => l.lightId === targetId);
    if (!light) {
      return res.status(404).json({ success: false, message: `Street Light ${lightId} not found` });
    }

    light.brightness = numericVal;
    light.status = 'ON';
    light.lastUpdated = new Date();

    return res.json({ success: true, data: light });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/street-lights/:lightId/mode
 * @desc    Change operating mode (AUTO, MANUAL, ECO_RADAR)
 */
export const updateStreetLightMode = async (req, res, next) => {
  try {
    const { lightId } = req.params;
    const { mode } = req.body;
    const targetId = lightId.toUpperCase();

    const validModes = ['AUTO', 'MANUAL', 'ECO_RADAR'];
    if (!mode || !validModes.includes(mode.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Mode must be one of: ${validModes.join(', ')}`
      });
    }

    const targetMode = mode.toUpperCase();

    if (mongoose.connection.readyState === 1) {
      const light = await StreetLight.findOne({ lightId: targetId });
      if (!light) {
        return res.status(404).json({ success: false, message: `Street Light ${lightId} not found` });
      }

      light.mode = targetMode;
      light.lastUpdated = new Date();
      await light.save();
      return res.json({ success: true, data: light });
    }

    const light = mockStreetLights.find(l => l.lightId === targetId);
    if (!light) {
      return res.status(404).json({ success: false, message: `Street Light ${lightId} not found` });
    }

    light.mode = targetMode;
    light.lastUpdated = new Date();

    return res.json({ success: true, data: light });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/street-lights/batch-mode
 * @desc    Batch update operating mode across all 16 city luminaires
 */
export const batchUpdateStreetLightMode = async (req, res, next) => {
  try {
    const { mode } = req.body;
    const validModes = ['AUTO', 'MANUAL', 'ECO_RADAR'];

    if (!mode || !validModes.includes(mode.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Mode must be one of: ${validModes.join(', ')}`
      });
    }

    const targetMode = mode.toUpperCase();

    if (mongoose.connection.readyState === 1) {
      await StreetLight.updateMany({}, { $set: { mode: targetMode, lastUpdated: new Date() } });
      const updated = await StreetLight.find().sort({ lightId: 1 });
      return res.json({
        success: true,
        message: `All street lights set to ${targetMode}`,
        summary: calculateLightingSummary(updated),
        data: updated
      });
    }

    // In-memory fallback
    mockStreetLights.forEach(l => {
      l.mode = targetMode;
      l.lastUpdated = new Date();
    });

    return res.json({
      success: true,
      message: `All street lights set to ${targetMode}`,
      summary: calculateLightingSummary(mockStreetLights),
      data: mockStreetLights
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/street-lights/:lightId/reset-fault
 * @desc    Clear diagnostic fault safely (status -> ON, isFaulty -> false, faultType -> NONE)
 */
export const resetStreetLightFault = async (req, res, next) => {
  try {
    const { lightId } = req.params;
    const targetId = lightId.toUpperCase();

    if (mongoose.connection.readyState === 1) {
      const light = await StreetLight.findOne({ lightId: targetId });
      if (!light) {
        return res.status(404).json({ success: false, message: `Street Light ${lightId} not found` });
      }

      if (!light.isFaulty && light.status !== 'FAULT') {
        return res.status(400).json({ success: false, message: 'No active fault to reset.' });
      }

      light.status = 'ON';
      light.isFaulty = false;
      light.faultType = 'NONE';
      if (!light.brightness || light.brightness === 0) {
        light.brightness = 80;
      }
      light.lastUpdated = new Date();
      await light.save();

      return res.json({
        success: true,
        message: `Fault cleared successfully for ${targetId}`,
        data: light
      });
    }

    // In-memory fallback
    const light = mockStreetLights.find(l => l.lightId === targetId);
    if (!light) {
      return res.status(404).json({ success: false, message: `Street Light ${lightId} not found` });
    }

    if (!light.isFaulty && light.status !== 'FAULT') {
      return res.status(400).json({ success: false, message: 'No active fault to reset.' });
    }

    light.status = 'ON';
    light.isFaulty = false;
    light.faultType = 'NONE';
    if (!light.brightness || light.brightness === 0) {
      light.brightness = 80;
    }
    light.lastUpdated = new Date();

    return res.json({
      success: true,
      message: `Fault cleared successfully for ${targetId}`,
      data: light
    });
  } catch (error) {
    next(error);
  }
};
