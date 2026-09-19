import express from 'express';
import { getTrafficSignals, updateSignalStatus, setEmergencyOverride } from '../controllers/trafficController.js';

const router = express.Router();

router.get('/', getTrafficSignals);
router.patch('/:junctionId/status', updateSignalStatus);
router.post('/emergency-override', setEmergencyOverride);

export default router;
