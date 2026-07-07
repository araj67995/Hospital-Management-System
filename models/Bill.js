const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    registrationFee: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    roomCharges: { type: Number, default: 0 },
    medicineCharges: { type: Number, default: 0 },
    testCharges: { type: Number, default: 0 },
    surgeryCharges: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Paid', 'Due', 'Partial'], default: 'Due' }
  },
  { timestamps: true }
);

billSchema.pre('validate', function calculateBill(next) {
  const gross = this.registrationFee + this.consultationFee + this.roomCharges + this.medicineCharges + this.testCharges + this.surgeryCharges + this.otherCharges;
  const taxable = Math.max(gross - this.discount, 0);
  this.total = taxable + this.gst;
  this.dueAmount = Math.max(this.total - this.paidAmount, 0);
  this.status = this.dueAmount === 0 ? 'Paid' : this.paidAmount > 0 ? 'Partial' : 'Due';
  next();
});

module.exports = mongoose.model('Bill', billSchema);
