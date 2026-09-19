import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import parkingRoutes from './parkingRoutes.js';
import trafficRoutes from './trafficRoutes.js';
import incidentRoutes from './incidentRoutes.js';
import statsRoutes from './statsRoutes.js';
import environmentRoutes from './environmentRoutes.js';
import streetLightRoutes from './streetLightRoutes.js';
import energyRoutes from './energyRoutes.js';

const router = express.Router();

/**
 * Health & API status route
 */
router.get('/status', (req, res) => {
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.json({
    success: true,
    project: 'SmartCity3D-Web',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusMap[mongoose.connection.readyState] || 'Unknown',
      readyState: mongoose.connection.readyState
    },
    endpoints: {
      auth: '/api/auth',
      parking: '/api/parking',
      traffic: '/api/traffic',
      incidents: '/api/incidents',
      stats: '/api/stats',
      environment: '/api/environment',
      streetLights: '/api/street-lights',
      energy: '/api/energy'
    }
  });
});

// Mount domain routes
router.use('/auth', authRoutes);
router.use('/parking', parkingRoutes);
router.use('/traffic', trafficRoutes);
router.use('/incidents', incidentRoutes);
router.use('/stats', statsRoutes);
router.use('/environment', environmentRoutes);
router.use('/street-lights', streetLightRoutes);
router.use('/energy', energyRoutes);

export default router;
