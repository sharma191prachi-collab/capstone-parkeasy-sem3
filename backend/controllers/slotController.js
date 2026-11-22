const Slot = require('../models/Slot');
const Lot = require('../models/Lot');
const AppError = require('../utils/AppError');

const checkOwnership = (lot, user) => {
  if (user.role !== 'admin' && lot.manager.toString() !== user._id.toString()) {
    throw new AppError('You can only manage your own lots', 403);
  }
};

// GET /api/lots/:lotId/slots
exports.getSlotsByLot = async (req, res, next) => {
  try {
    const slots = await Slot.find({ lot: req.params.lotId }).sort('slotNumber');
    res.json({ success: true, count: slots.length, slots });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/slots/:id/status
exports.updateSlotStatus = async (req, res, next) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) throw new AppError('Slot not found', 404);

    const lot = await Lot.findById(slot.lot);
    checkOwnership(lot, req.user);

    slot.status = req.body.status;
    await slot.save();

    req.app.get('io').emit('slotUpdated', {
      slotId: slot._id, lotId: slot.lot, status: slot.status,
    });

    res.json({ success: true, slot });
  } catch (err) {
    next(err);
  }
};

// POST /api/lots/:lotId/slots
exports.addSlot = async (req, res, next) => {
  try {
    const lot = await Lot.findById(req.params.lotId);
    if (!lot) throw new AppError('Lot not found', 404);
    checkOwnership(lot, req.user);

    const last = await Slot.findOne({ lot: lot._id }).sort('-slotNumber');
    const slot = await Slot.create({
      lot: lot._id,
      slotNumber: last ? last.slotNumber + 1 : 1,
    });

    lot.totalSlots += 1;
    await lot.save();

    res.status(201).json({ success: true, slot });
  } catch (err) {
    next(err);
  }
};
