import express from 'express';
import { getEnergySummary } from '../controllers/energyController.js';

const router = express.Router();

/**
 * @route   GET /api/energy/summary
 * @desc    Get smart city energy analytics, current power demand, and zone consumption
 * @access  Public
 */
router.get('/summary', getEnergySummary);

export default router;
