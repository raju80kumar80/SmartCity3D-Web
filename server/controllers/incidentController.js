import mongoose from 'mongoose';
import EmergencyIncident from '../models/EmergencyIncident.js';

let mockIncidents = [
  {
    _id: 'mock_inc_1',
    incidentId: 'INC-101',
    type: 'AMBULANCE',
    locationName: 'North Tech Park (Sector 3)',
    coordinates: { x: -14, z: -14 },
    description: 'Medical emergency reported at Sector 3',
    severity: 'HIGH',
    status: 'REPORTED',
    reportedAt: new Date(Date.now() - 1000 * 60 * 15)
  }
];

/**
 * @route   GET /api/incidents
 * @desc    Get all emergency incidents
 */
export const getIncidents = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const incidents = await EmergencyIncident.find().sort({ reportedAt: -1 });
      return res.json({ success: true, count: incidents.length, data: incidents });
    }
    return res.json({ success: true, count: mockIncidents.length, data: mockIncidents });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/incidents
 * @desc    Report / Dispatch an emergency service
 */
export const createIncident = async (req, res, next) => {
  try {
    const { type, locationName, coordinates, description, severity } = req.body;

    if (!type || !locationName) {
      return res.status(400).json({ success: false, message: 'Type and locationName are required' });
    }

    const incidentId = `INC-${Math.floor(100 + Math.random() * 900)}`;
    const incidentData = {
      incidentId,
      type: type.toUpperCase(),
      locationName,
      coordinates: coordinates || { x: 0, z: 0 },
      description: description || `${type} dispatched to ${locationName}`,
      severity: severity || 'HIGH',
      status: 'DISPATCHED',
      reportedAt: new Date(),
      dispatchedAt: new Date()
    };

    if (mongoose.connection.readyState === 1) {
      const incident = await EmergencyIncident.create(incidentData);
      return res.status(201).json({ success: true, message: 'Emergency unit dispatched', data: incident });
    } else {
      mockIncidents.unshift(incidentData);
      return res.status(201).json({ success: true, mode: 'in-memory', message: 'Emergency unit dispatched', data: incidentData });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/incidents/:incidentId/resolve
 * @desc    Resolve an emergency incident
 */
export const resolveIncident = async (req, res, next) => {
  try {
    const { incidentId } = req.params;

    if (mongoose.connection.readyState === 1) {
      const incident = await EmergencyIncident.findOne({ incidentId: incidentId.toUpperCase() });
      if (!incident) {
        return res.status(404).json({ success: false, message: 'Incident not found' });
      }

      incident.status = 'RESOLVED';
      incident.resolvedAt = new Date();
      await incident.save();

      return res.json({ success: true, message: 'Incident resolved', data: incident });
    } else {
      const incident = mockIncidents.find(i => i.incidentId === incidentId.toUpperCase());
      if (!incident) {
        return res.status(404).json({ success: false, message: 'Incident not found' });
      }

      incident.status = 'RESOLVED';
      incident.resolvedAt = new Date();

      return res.json({ success: true, mode: 'in-memory', message: 'Incident resolved', data: incident });
    }
  } catch (error) {
    next(error);
  }
};
