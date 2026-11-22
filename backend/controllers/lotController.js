const Lot = require('../models/Lot');
const Slot = require('../models/Slot');
const AppError = require('../utils/AppError');

const checkOwnership = (lot, user) => {
  if (user.role !== 'admin' && lot.manager.toString() !== user._id.toString()) {
    throw new AppError('You can only manage your own lots', 403);
  }
};

// POST /api/lots
exports.createLot = async (req, res, next) => {
  try {
    const { name, address, totalSlots, ratePerHour } = req.body;

    const lot = await Lot.create({
      name, address, totalSlots, ratePerHour,
      manager: req.user._id,
    });

    const slots = Array.from({ length: lot.totalSlots }, (_, i) => ({
      lot: lot._id,
      slotNumber: i + 1,
    }));
    await Slot.insertMany(slots);

    res.status(201).json({ success: true, lot });
  } catch (err) {
    next(err);
  }
};

// GET /api/lots
exports.getLots = async (req, res, next) => {
  try {
    const lots = await Lot.find().populate('manager', 'name email').sort('-createdAt');
    res.json({ success: true, count: lots.length, lots });
  } catch (err) {
    next(err);
  }
};

// GET /api/lots/:id
exports.getLot = async (req, res, next) => {
  try {
    const lot = await Lot.findById(req.params.id).populate('manager', 'name email');
    if (!lot) throw new AppError('Lot not found', 404);
    res.json({ success: true, lot });
  } catch (err) {
    next(err);
  }
};

// PUT /api/lots/:id
exports.updateLot = async (req, res, next) => {
  try {
    const lot = await Lot.findById(req.params.id);
    if (!lot) throw new AppError('Lot not found', 404);
    checkOwnership(lot, req.user);

    const { name, address, ratePerHour } = req.body;
    if (name !== undefined) lot.name = name;
    if (address !== undefined) lot.address = address;
    if (ratePerHour !== undefined) lot.ratePerHour = ratePerHour;

    await lot.save();
    res.json({ success: true, lot });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/lots/:id
exports.deleteLot = async (req, res, next) => {
  try {
    const lot = await Lot.findById(req.params.id);
    if (!lot) throw new AppError('Lot not found', 404);
    checkOwnership(lot, req.user);

    await Slot.deleteMany({ lot: lot._id });
    await lot.deleteOne();

    res.json({ success: true, message: 'Lot and its slots deleted' });
  } catch (err) {
    next(err);
  }
};
