import express from 'express';
import { getIncidents, createIncident, resolveIncident } from '../controllers/incidentController.js';

const router = express.Router();

router.get('/', getIncidents);
router.post('/', createIncident);
router.patch('/:incidentId/resolve', resolveIncident);

export default router;
