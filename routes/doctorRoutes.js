const express = require('express');
const dashboard = require('../controllers/dashboardController');
const crud = require('../controllers/crudController');
const meta = require('../controllers/meta');
const { requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(requireRole('doctor'));
router.get('/', dashboard.doctor);
router.get('/patients', crud.list('patients', '/doctor'));

['appointments', 'prescriptions', 'reports'].forEach((resource) => {
  const field = meta[resource].uploadField || 'attachment';
  router.get(`/${resource}`, crud.list(resource, '/doctor'));
  router.get(`/${resource}/new`, crud.form(resource, '/doctor'));
  router.post(`/${resource}`, upload.single(field), crud.create(resource, '/doctor'));
  router.get(`/${resource}/:id/edit`, crud.form(resource, '/doctor'));
  router.put(`/${resource}/:id`, upload.single(field), crud.update(resource, '/doctor'));
});

router.get('/schedule', crud.list('appointments', '/doctor'));

module.exports = router;
