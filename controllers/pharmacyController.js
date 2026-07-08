const PDFDocument = require('pdfkit');
const Medicine = require('../models/Medicine');
const Patient = require('../models/Patient');
const PharmacyBill = require('../models/PharmacyBill');

async function nextBillNo() {
  const latest = await PharmacyBill.findOne({ billNo: /^PHR\d+$/ }).sort({ billNo: -1 }).select('billNo').lean();
  const latestNumber = latest?.billNo ? Number(latest.billNo.replace('PHR', '')) : 0;
  return `PHR${String(latestNumber + 1).padStart(5, '0')}`;
}

function normalizeItems(items) {
  const rows = Array.isArray(items) ? items : Object.values(items || {});
  return rows
    .map((item) => {
      const quantity = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      return {
        medicine: item.medicine,
        name: item.name,
        unit: item.unit || 'Packet',
        priceType: item.priceType || 'unit',
        quantity,
        rate,
        amount: Number((quantity * rate).toFixed(2))
      };
    })
    .filter((item) => item.medicine && item.quantity > 0);
}

async function reduceStock(items) {
  for (const item of items) {
    const medicine = await Medicine.findById(item.medicine);
    if (!medicine) throw new Error(`${item.name || 'Medicine'} not found`);
    if (medicine.quantity < item.quantity) throw new Error(`${medicine.name} has only ${medicine.quantity} in stock`);
    medicine.quantity -= item.quantity;
    await medicine.save();
  }
}

exports.counter = async (req, res, next) => {
  try {
    const [medicines, patients, recentBills] = await Promise.all([
      Medicine.find().sort('name').lean(),
      Patient.find().sort('name').lean(),
      PharmacyBill.find().populate('patient').sort({ createdAt: -1 }).limit(8).lean()
    ]);
    res.render('pharmacy/counter', { title: 'Medicine Shop', medicines, patients, recentBills });
  } catch (error) {
    next(error);
  }
};

exports.createBill = async (req, res, next) => {
  try {
    const items = normalizeItems(req.body.items);
    if (!items.length) {
      req.flash('error', 'Add at least one medicine to the bill');
      return res.redirect('/pharmacy');
    }
    await reduceStock(items);
    const bill = await PharmacyBill.create({
      billNo: await nextBillNo(),
      patient: req.body.patient || undefined,
      customerName: req.body.customerName,
      customerMobile: req.body.customerMobile,
      items,
      paidAmount: Number(req.body.paidAmount || 0)
    });
    req.flash('success', `Medicine bill ${bill.billNo} generated`);
    res.redirect(`/pharmacy/${bill._id}/invoice`);
  } catch (error) {
    next(error);
  }
};

exports.invoice = async (req, res, next) => {
  try {
    const bill = await PharmacyBill.findById(req.params.id).populate('patient').lean();
    if (!bill) {
      req.flash('error', 'Medicine bill not found');
      return res.redirect('/pharmacy');
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${bill.billNo}.pdf`);
    doc.pipe(res);

    doc.fontSize(22).text(process.env.HOSPITAL_NAME || 'CarePoint Hospital', { align: 'center' });
    doc.fontSize(14).text('Medicine Shop Bill', { align: 'center' }).moveDown();
    doc.fontSize(11).text(`Bill No: ${bill.billNo}`);
    doc.text(`Customer: ${bill.patient?.name || bill.customerName || 'Walk-in Customer'}`);
    doc.text(`Mobile: ${bill.patient?.mobile || bill.customerMobile || ''}`);
    doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`).moveDown();

    bill.items.forEach((item) => {
      doc.text(`${item.name} (${item.priceType === 'piece' ? 'Per Piece' : item.unit}) x ${item.quantity} @ Rs. ${Number(item.rate || 0).toFixed(2)} = Rs. ${Number(item.amount || 0).toFixed(2)}`);
    });
    doc.moveDown();
    doc.text(`Subtotal: Rs. ${bill.subtotal.toFixed(2)}`);
    doc.text(`GST 18%: Rs. ${Number(bill.gst || 0).toFixed(2)}`);
    doc.text(`Discount 10%: Rs. ${Number(bill.discount || 0).toFixed(2)}`);
    doc.fontSize(14).text(`Total: Rs. ${bill.total.toFixed(2)}`);
    doc.text(`Paid: Rs. ${bill.paidAmount.toFixed(2)}`);
    doc.text(`Due: Rs. ${bill.dueAmount.toFixed(2)}`);
    doc.end();
  } catch (error) {
    next(error);
  }
};
