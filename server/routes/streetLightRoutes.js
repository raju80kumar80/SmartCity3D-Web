import express from 'express';
import {
  getStreetLights,
  getStreetLightById,
  toggleStreetLightStatus,
  updateStreetLightBrightness,
  updateStreetLightMode,
  batchUpdateStreetLightMode,
  resetStreetLightFault
} from '../controllers/streetLightController.js';

const router = express.Router();

// GET /api/street-lights - All luminaires + city lighting summary
router.get('/', getStreetLights);

// GET /api/street-lights/:lightId - Single luminaire details
router.get('/:lightId', getStreetLightById);

// PATCH /api/street-lights/:lightId/reset-fault - Clear diagnostic fault safely
router.patch('/:lightId/reset-fault', resetStreetLightFault);

// PATCH /api/street-lights/:lightId/status - Turn ON/OFF or reset fault
router.patch('/:lightId/status', toggleStreetLightStatus);

// PATCH /api/street-lights/:lightId/brightness - Set brightness (10 - 100%)
router.patch('/:lightId/brightness', updateStreetLightBrightness);

// PATCH /api/street-lights/:lightId/mode - Switch mode (AUTO, MANUAL, ECO_RADAR)
router.patch('/:lightId/mode', updateStreetLightMode);

// POST /api/street-lights/batch-mode - Set city-wide mode
router.post('/batch-mode', batchUpdateStreetLightMode);

export default router;
