const PDFDocument = require('pdfkit');
const Bill = require('../models/Bill');

exports.invoice = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('patient appointment').lean();
    if (!bill) {
      req.flash('error', 'Bill not found');
      return res.redirect('back');
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${bill.billNo}.pdf`);
    doc.pipe(res);

    doc.fontSize(22).text(process.env.HOSPITAL_NAME || 'CarePoint Hospital', { align: 'center' });
    doc.fontSize(14).text('Invoice', { align: 'center' }).moveDown();
    doc.fontSize(11).text(`Bill No: ${bill.billNo}`);
    doc.text(`Patient: ${bill.patient?.name || ''}`);
    doc.text(`Mobile: ${bill.patient?.mobile || ''}`);
    doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`).moveDown();

    const rows = [
      ['Registration Fee', bill.registrationFee],
      ['Consultation Fee', bill.consultationFee],
      ['Room Charges', bill.roomCharges],
      ['Medicine Charges', bill.medicineCharges],
      ['Test Charges', bill.testCharges],
      ['Surgery Charges', bill.surgeryCharges],
      ['Other Charges', bill.otherCharges],
      ['Discount', -bill.discount],
      ['GST', bill.gst]
    ];
    rows.forEach(([label, amount]) => doc.text(`${label}: Rs. ${Number(amount || 0).toFixed(2)}`));
    doc.moveDown().fontSize(14).text(`Total: Rs. ${bill.total.toFixed(2)}`);
    doc.text(`Paid: Rs. ${bill.paidAmount.toFixed(2)}`);
    doc.text(`Due: Rs. ${bill.dueAmount.toFixed(2)}`);
    doc.end();
  } catch (error) {
    next(error);
  }
};
