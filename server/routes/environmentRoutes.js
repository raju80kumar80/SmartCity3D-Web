import express from 'express';
import {
  getEnvironmentSensors,
  getEnvironmentSensorById,
  toggleEcoFilter
} from '../controllers/environmentController.js';

const router = express.Router();

// GET /api/environment - All sensors + summary
router.get('/', getEnvironmentSensors);

// GET /api/environment/:sensorId - Specific station readings
router.get('/:sensorId', getEnvironmentSensorById);

// PATCH /api/environment/:sensorId/eco-filter - Toggle air purification / mist mitigation
router.patch('/:sensorId/eco-filter', toggleEcoFilter);

export default router;
