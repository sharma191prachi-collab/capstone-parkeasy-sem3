const express = require('express');
const { occupancyReport, revenueReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('manager', 'admin'));

router.get('/occupancy', occupancyReport);
router.get('/revenue', revenueReport);

module.exports = router;
