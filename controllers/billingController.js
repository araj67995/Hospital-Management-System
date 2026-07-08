const PDFDocument = require('pdfkit');
const Bill = require('../models/Bill');

exports.invoice = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('patient appointment medicineItems.medicine').lean();
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

    if (bill.serviceItems?.length) {
      doc.fontSize(13).text('Hospital Charges').moveDown(0.3);
      bill.serviceItems.forEach((item) => {
        doc.fontSize(10).text(`${item.category} - ${item.description}: ${item.quantity} x Rs. ${Number(item.rate || 0).toFixed(2)} = Rs. ${Number(item.amount || 0).toFixed(2)}`);
      });
      doc.moveDown();
    } else {
      const rows = [
        ['Registration Fee', bill.registrationFee],
        ['Consultation Fee', bill.consultationFee],
        ['Room Charges', bill.roomCharges],
        ['Test Charges', bill.testCharges],
        ['Surgery Charges', bill.surgeryCharges],
        ['Other Charges', bill.otherCharges]
      ];
      rows.filter(([, amount]) => Number(amount || 0) > 0).forEach(([label, amount]) => doc.text(`${label}: Rs. ${Number(amount || 0).toFixed(2)}`));
    }
    if (bill.medicineItems?.length) {
      doc.fontSize(13).text('Medicine Charges').moveDown(0.3);
      bill.medicineItems.forEach((item) => {
        doc.fontSize(10).text(`${item.name} (${item.unit}) x ${item.quantity} @ Rs. ${Number(item.rate || 0).toFixed(2)} = Rs. ${Number(item.amount || 0).toFixed(2)}`);
      });
      doc.moveDown();
    } else if (bill.medicineCharges) {
      doc.text(`Medicine Charges: Rs. ${Number(bill.medicineCharges || 0).toFixed(2)}`);
    }
    doc.text(`Discount: Rs. ${Number(bill.discount || 0).toFixed(2)}`);
    doc.text(`GST: Rs. ${Number(bill.gst || 0).toFixed(2)}`);
    doc.moveDown().fontSize(14).text(`Total: Rs. ${bill.total.toFixed(2)}`);
    doc.text(`Paid: Rs. ${bill.paidAmount.toFixed(2)}`);
    doc.text(`Due: Rs. ${bill.dueAmount.toFixed(2)}`);
    doc.end();
  } catch (error) {
    next(error);
  }
};
