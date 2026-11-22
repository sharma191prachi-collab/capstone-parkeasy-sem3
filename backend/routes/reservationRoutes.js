const express = require('express');
const {
  createReservation, getMyReservations, getAllReservations,
  checkIn, exitReservation, cancelReservation,
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(authorize('driver'), createReservation)
  .get(authorize('manager', 'admin'), getAllReservations);

router.get('/my', getMyReservations);
router.patch('/:id/checkin', checkIn);
router.patch('/:id/exit', exitReservation);
router.patch('/:id/cancel', cancelReservation);

module.exports = router;
