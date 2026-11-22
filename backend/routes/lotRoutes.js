const express = require('express');
const {
  createLot, getLots, getLot, updateLot, deleteLot,
} = require('../controllers/lotController');
const { getSlotsByLot, addSlot } = require('../controllers/slotController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(protect, getLots)
  .post(protect, authorize('manager', 'admin'), createLot);

router
  .route('/:id')
  .get(protect, getLot)
  .put(protect, authorize('manager', 'admin'), updateLot)
  .delete(protect, authorize('manager', 'admin'), deleteLot);

router
  .route('/:lotId/slots')
  .get(protect, getSlotsByLot)
  .post(protect, authorize('manager', 'admin'), addSlot);

module.exports = router;
