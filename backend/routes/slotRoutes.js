const express = require('express');
const { updateSlotStatus } = require('../controllers/slotController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.patch('/:id/status', protect, authorize('manager', 'admin'), updateSlotStatus);

module.exports = router;
