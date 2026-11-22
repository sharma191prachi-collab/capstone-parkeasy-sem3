const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    lot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lot',
      required: true,
    },
    slotNumber: {
      type: Number,
      required: [true, 'Slot number is required'],
      min: 1,
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'reserved', 'occupied'],
        message: 'Status must be available, reserved or occupied',
      },
      default: 'available',
    },
  },
  { timestamps: true }
);

// INDEX: same slotNumber cannot repeat inside one lot
slotSchema.index({ lot: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
