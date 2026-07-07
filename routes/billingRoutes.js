const express = require('express');
const billing = require('../controllers/billingController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/:id/invoice', billing.invoice);

module.exports = router;
