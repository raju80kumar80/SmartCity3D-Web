import mongoose from 'mongoose';
import CityStat from '../models/CityStat.js';
import ParkingSlot from '../models/ParkingSlot.js';
import TrafficSignal from '../models/TrafficSignal.js';
import EmergencyIncident from '../models/EmergencyIncident.js';

/**
 * @route   GET /api/stats
 * @desc    Get aggregated real-time city metrics for dashboard
 */
export const getCityStats = async (req, res, next) => {
  try {
    let stats = {
      powerConsumptionKw: 1280,
      activeVehicles: 54,
      airQualityIndex: 38,
      waterConsumptionLiters: 9400,
      renewableEnergyPercentage: 72,
      parking: {
        total: 8,
        occupied: 3,
        available: 5,
        occupancyRate: 37.5
      },
      trafficSignals: {
        total: 4,
        green: 2,
        red: 2,
        emergencyOverride: false
      },
      emergencies: {
        activeCount: 1,
        resolvedCount: 0
      },
      timestamp: new Date().toISOString()
    };

    if (mongoose.connection.readyState === 1) {
      // Calculate dynamic parking metrics from DB
      const parkingSlots = await ParkingSlot.find();
      if (parkingSlots.length > 0) {
        const total = parkingSlots.length;
        const occupied = parkingSlots.filter(s => s.isOccupied).length;
        stats.parking = {
          total,
          occupied,
          available: total - occupied,
          occupancyRate: Number(((occupied / total) * 100).toFixed(1))
        };
      }

      // Calculate dynamic signal metrics from DB
      const signals = await TrafficSignal.find();
      if (signals.length > 0) {
        stats.trafficSignals = {
          total: signals.length,
          green: signals.filter(s => s.status === 'GREEN').length,
          red: signals.filter(s => s.status === 'RED').length,
          emergencyOverride: signals.some(s => s.emergencyOverride)
        };
      }

      // Calculate incidents from DB
      const incidents = await EmergencyIncident.find();
      if (incidents.length > 0) {
        stats.emergencies = {
          activeCount: incidents.filter(i => i.status !== 'RESOLVED').length,
          resolvedCount: incidents.filter(i => i.status === 'RESOLVED').length
        };
      }

      // Fetch latest custom metric if available
      const latestMetric = await CityStat.findOne().sort({ timestamp: -1 });
      if (latestMetric) {
        stats.powerConsumptionKw = latestMetric.powerConsumptionKw;
        stats.activeVehicles = latestMetric.activeVehicles;
        stats.airQualityIndex = latestMetric.airQualityIndex;
        stats.renewableEnergyPercentage = latestMetric.renewableEnergyPercentage;
      }
    }

    return res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
