import express from 'express';
import { getCityStats } from '../controllers/statsController.js';

const router = express.Router();

router.get('/', getCityStats);

export default router;
