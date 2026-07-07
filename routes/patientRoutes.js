const express = require('express');
const dashboard = require('../controllers/dashboardController');
const patient = require('../controllers/patientController');
const { requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(requireRole('patient'));
router.get('/', dashboard.patient);
router.get('/profile', dashboard.patient);
router.get('/profile/edit', patient.profileForm);
router.post('/profile', upload.single('photo'), patient.updateProfile);
router.get('/appointments', dashboard.patient);
router.get('/prescriptions', dashboard.patient);
router.get('/reports', dashboard.patient);
router.get('/bills', dashboard.patient);

module.exports = router;
