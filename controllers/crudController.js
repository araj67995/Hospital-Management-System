const meta = require('./meta');
const bcrypt = require('bcrypt');
const User = require('../models/User');

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function formatValue(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value == null ? '' : value;
}

async function nextCode(Model, prefix, field) {
  const count = await Model.countDocuments();
  return `${prefix}${String(count + 1).padStart(5, '0')}`;
}

async function loadOptions(resource) {
  const config = meta[resource];
  const options = {};
  for (const field of config.fields.filter((item) => item.type === 'ref')) {
    options[field.name] = await field.ref.model.find().sort(field.ref.label).lean();
  }
  return options;
}

function normalizeBody(resource, body, file) {
  const config = meta[resource];
  const data = { ...(config.fixed || {}) };
  for (const field of config.fields) {
    if (field.virtual || field.type === 'file') continue;
    if (resource === 'receptionists' && field.name === 'password' && !body.password) continue;
    if (resource === 'doctors' && field.name === 'password') continue;
    if (field.name === 'active') data[field.name] = body[field.name] === 'true';
    else
    if (field.type === 'number') data[field.name] = Number(body[field.name] || 0);
    else if (field.type === 'date') data[field.name] = body[field.name] || undefined;
    else data[field.name] = body[field.name] || undefined;
  }

  if (file && config.uploadField) data[config.uploadField] = `/${file.path.replace(/\\/g, '/')}`;

  if (resource === 'prescriptions') {
    data.medicines = [
      {
        name: body.medicineName,
        dosage: body.dosage,
        morning: Boolean(body.morning),
        afternoon: Boolean(body.afternoon),
        night: Boolean(body.night),
        days: Number(body.days || 0),
        instructions: body.instructions
      }
    ].filter((medicine) => medicine.name);
  }

  return data;
}

exports.list = (resource, basePath = '/admin') => async (req, res, next) => {
  try {
    const config = meta[resource];
    const search = String(req.query.q || '').trim();
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = 10;
    const query = { ...(config.fixed || {}) };

    if (search) {
      const searchable = ['name', 'email', 'mobile', 'patientId', 'doctorId', 'appointmentNo', 'billNo', 'roomNumber', 'batchNumber', 'title'];
      query.$or = searchable.map((field) => ({ [field]: new RegExp(search, 'i') }));
    }

    let dbQuery = config.model.find(query);
    config.populate.forEach((path) => {
      dbQuery = dbQuery.populate(path);
    });
    const [items, total] = await Promise.all([
      dbQuery.sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      config.model.countDocuments(query)
    ]);

    res.render('admin/list', {
      title: config.title,
      resource,
      config,
      items,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      search,
      basePath,
      getNested,
      formatValue
    });
  } catch (error) {
    next(error);
  }
};

exports.form = (resource, basePath = '/admin') => async (req, res, next) => {
  try {
    const config = meta[resource];
    const item = req.params.id ? await config.model.findById(req.params.id).lean() : {};
    const options = await loadOptions(resource);

    for (const field of config.fields.filter((itemField) => itemField.auto && !item[itemField.name])) {
      item[field.name] = await nextCode(config.model, field.auto, field.name);
    }

    res.render('admin/form', { title: `${item._id ? 'Edit' : 'Add'} ${config.singular}`, resource, config, item, options, basePath });
  } catch (error) {
    next(error);
  }
};

exports.create = (resource, basePath = '/admin') => async (req, res, next) => {
  try {
    const config = meta[resource];
    const item = await config.model.create(normalizeBody(resource, req.body, req.file));
    if (resource === 'doctors') {
      await User.create({
        name: item.name,
        email: item.email,
        password: req.body.password,
        role: 'doctor',
        doctor: item._id
      });
    }
    req.flash('success', `${config.singular} saved successfully`);
    res.redirect(`${basePath}/${resource}`);
  } catch (error) {
    next(error);
  }
};

exports.update = (resource, basePath = '/admin') => async (req, res, next) => {
  try {
    const config = meta[resource];
    const data = normalizeBody(resource, req.body, req.file);
    if (resource === 'receptionists' && data.password) data.password = await bcrypt.hash(data.password, 12);
    const item = await config.model.findByIdAndUpdate(req.params.id, data, { runValidators: true, new: true });
    if (resource === 'doctors' && item) {
      const userData = { name: item.name, email: item.email, role: 'doctor', doctor: item._id };
      if (req.body.password) userData.password = await bcrypt.hash(req.body.password, 12);
      await User.findOneAndUpdate({ doctor: item._id }, userData, { upsert: true, runValidators: true, setDefaultsOnInsert: true });
    }
    req.flash('success', `${config.singular} updated successfully`);
    res.redirect(`${basePath}/${resource}`);
  } catch (error) {
    next(error);
  }
};

exports.remove = (resource, basePath = '/admin') => async (req, res, next) => {
  try {
    const config = meta[resource];
    await config.model.findByIdAndDelete(req.params.id);
    req.flash('success', `${config.singular} deleted successfully`);
    res.redirect(`${basePath}/${resource}`);
  } catch (error) {
    next(error);
  }
};
