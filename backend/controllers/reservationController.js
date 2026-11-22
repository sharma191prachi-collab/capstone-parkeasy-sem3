const Reservation = require('../models/Reservation');
const Slot = require('../models/Slot');
const Lot = require('../models/Lot');
const AppError = require('../utils/AppError');

// Recompute slot status from reservations and broadcast it live
const refreshSlotStatus = async (slotId, io) => {
  const now = new Date();
  let status = 'available';

  const active = await Reservation.exists({ slot: slotId, status: 'active' });
  if (active) {
    status = 'occupied';
  } else {
    const upcoming = await Reservation.exists({
      slot: slotId, status: 'reserved', endTime: { $gt: now },
    });
    if (upcoming) status = 'reserved';
  }

  const slot = await Slot.findByIdAndUpdate(slotId, { status }, { new: true });
  io.emit('slotUpdated', { slotId: slot._id, lotId: slot.lot, status: slot.status });
};

// Fetch reservation + permission check
const getOwnReservation = async (req) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw new AppError('Reservation not found', 404);

  const isOwner = reservation.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role === 'driver') {
    throw new AppError('Not allowed to modify this reservation', 403);
  }
  return reservation;
};

// POST /api/reservations  (driver)
exports.createReservation = async (req, res, next) => {
  try {
    const { slotId, startTime, endTime } = req.body;
    if (!slotId || !startTime || !endTime) {
      throw new AppError('slotId, startTime and endTime are required', 400);
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start) || isNaN(end)) throw new AppError('Invalid date format', 400);
    if (end <= start) throw new AppError('End time must be after start time', 400);
    if (end <= new Date()) throw new AppError('End time must be in the future', 400);

    const slot = await Slot.findById(slotId);
    if (!slot) throw new AppError('Slot not found', 404);

    // Overlap: existing.start < new.end AND existing.end > new.start
    const clash = await Reservation.findOne({
      slot: slot._id,
      status: { $in: ['reserved', 'active'] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });
    if (clash) throw new AppError('Slot is already booked for this time window', 409);

    const reservation = await Reservation.create({
      user: req.user._id,
      lot: slot.lot,
      slot: slot._id,
      startTime: start,
      endTime: end,
    });

    await refreshSlotStatus(slot._id, req.app.get('io'));
    res.status(201).json({ success: true, reservation });
  } catch (err) {
    next(err);
  }
};

// GET /api/reservations/my
exports.getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('lot', 'name address ratePerHour')
      .populate('slot', 'slotNumber')
      .sort('-createdAt');
    res.json({ success: true, count: reservations.length, reservations });
  } catch (err) {
    next(err);
  }
};

// GET /api/reservations  (manager: own lots, admin: all)
exports.getAllReservations = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'manager') {
      filter.lot = { $in: await Lot.find({ manager: req.user._id }).distinct('_id') };
    }
    const reservations = await Reservation.find(filter)
      .populate('user', 'name email')
      .populate('lot', 'name')
      .populate('slot', 'slotNumber')
      .sort('-createdAt');
    res.json({ success: true, count: reservations.length, reservations });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/reservations/:id/checkin
exports.checkIn = async (req, res, next) => {
  try {
    const reservation = await getOwnReservation(req);
    if (reservation.status !== 'reserved') {
      throw new AppError(`Cannot check in a ${reservation.status} reservation`, 400);
    }
    reservation.status = 'active';
    await reservation.save();

    await refreshSlotStatus(reservation.slot, req.app.get('io'));
    res.json({ success: true, reservation });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/reservations/:id/exit  (fee calculation)
exports.exitReservation = async (req, res, next) => {
  try {
    const reservation = await getOwnReservation(req);
    if (reservation.status !== 'active') {
      throw new AppError('Only an active (checked-in) reservation can exit', 400);
    }

    const lot = await Lot.findById(reservation.lot);
    const exitTime = new Date();

    // Hours rounded up, minimum 1 hour
    const hours = Math.max(1, Math.ceil((exitTime - reservation.startTime) / (1000 * 60 * 60)));

    reservation.exitTime = exitTime;
    reservation.fee = hours * lot.ratePerHour;
    reservation.status = 'completed';
    await reservation.save();

    await refreshSlotStatus(reservation.slot, req.app.get('io'));
    res.json({ success: true, hours, fee: reservation.fee, reservation });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/reservations/:id/cancel
exports.cancelReservation = async (req, res, next) => {
  try {
    const reservation = await getOwnReservation(req);
    if (reservation.status !== 'reserved') {
      throw new AppError('Only a reserved booking can be cancelled', 400);
    }
    reservation.status = 'cancelled';
    await reservation.save();

    await refreshSlotStatus(reservation.slot, req.app.get('io'));
    res.json({ success: true, reservation });
  } catch (err) {
    next(err);
  }
};
