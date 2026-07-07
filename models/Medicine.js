const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    company: String,
    batchNumber: { type: String, required: true },
    manufacturingDate: Date,
    expiryDate: Date,
    quantity: { type: Number, default: 0 },
    lowStockLimit: { type: Number, default: 10 },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 }
  },
  { timestamps: true }
);

medicineSchema.virtual('isLowStock').get(function isLowStock() {
  return this.quantity <= this.lowStockLimit;
});

module.exports = mongoose.model('Medicine', medicineSchema);
