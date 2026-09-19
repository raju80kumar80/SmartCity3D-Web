import express from 'express';
import { getParkingSlots, toggleSlotOccupancy, reserveSlot, releaseSlot } from '../controllers/parkingController.js';

const router = express.Router();

router.get('/', getParkingSlots);
router.patch('/:slotCode/toggle', toggleSlotOccupancy);
router.post('/reserve', reserveSlot);
router.post('/release', releaseSlot);

export default router;
