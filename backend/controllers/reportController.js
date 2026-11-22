const Slot = require('../models/Slot');
const Reservation = require('../models/Reservation');
const Lot = require('../models/Lot');

// Manager sees own lots only, admin sees all
const getLotFilter = async (user) => {
  if (user.role === 'manager') {
    return { lot: { $in: await Lot.find({ manager: user._id }).distinct('_id') } };
  }
  return {};
};

// GET /api/reports/occupancy
exports.occupancyReport = async (req, res, next) => {
  try {
    const match = await getLotFilter(req.user);

    const report = await Slot.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$lot',
          total: { $sum: 1 },
          available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
          reserved: { $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] } },
          occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
        },
      },
      { $lookup: { from: 'lots', localField: '_id', foreignField: '_id', as: 'lot' } },
      { $unwind: '$lot' },
      {
        $project: {
          _id: 0,
          lotId: '$_id',
          lotName: '$lot.name',
          total: 1,
          available: 1,
          reserved: 1,
          occupied: 1,
          occupancyPercent: {
            $round: [
              { $multiply: [{ $divide: [{ $add: ['$reserved', '$occupied'] }, '$total'] }, 100] },
              1,
            ],
          },
        },
      },
      { $sort: { lotName: 1 } },
    ]);

    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/revenue?from=2026-11-01&to=2026-11-30
exports.revenueReport = async (req, res, next) => {
  try {
    const match = { status: 'completed', ...(await getLotFilter(req.user)) };

    if (req.query.from || req.query.to) {
      match.exitTime = {};
      if (req.query.from) match.exitTime.$gte = new Date(req.query.from);
      if (req.query.to) match.exitTime.$lte = new Date(req.query.to);
    }

    const report = await Reservation.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$lot',
          totalRevenue: { $sum: '$fee' },
          totalBookings: { $sum: 1 },
          avgFee: { $avg: '$fee' },
        },
      },
      { $lookup: { from: 'lots', localField: '_id', foreignField: '_id', as: 'lot' } },
      { $unwind: '$lot' },
      {
        $project: {
          _id: 0,
          lotId: '$_id',
          lotName: '$lot.name',
          totalRevenue: 1,
          totalBookings: 1,
          avgFee: { $round: ['$avgFee', 2] },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    const grandTotal = report.reduce((sum, r) => sum + r.totalRevenue, 0);
    res.json({ success: true, grandTotal, report });
  } catch (err) {
    next(err);
  }
};
