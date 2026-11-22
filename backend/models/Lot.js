const mongoose = require('mongoose');

const lotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lot name is required'],
      trim: true,
      minlength: [2, 'Lot name must be at least 2 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    totalSlots: {
      type: Number,
      required: [true, 'Total slots is required'],
      min: [1, 'Lot must have at least 1 slot'],
      max: [500, 'Lot cannot have more than 500 slots'],
    },
    ratePerHour: {
      type: Number,
      required: [true, 'Rate per hour is required'],
      min: [0, 'Rate cannot be negative'],
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lot', lotSchema);
