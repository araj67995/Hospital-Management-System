const Patient = require('../models/Patient');

exports.profileForm = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.session.user.patient).lean();
    res.render('patient/profile-form', { title: 'Update Profile', patient });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'fatherName', 'dob', 'age', 'bloodGroup', 'mobile', 'email', 'address', 'aadhaarNumber', 'emergencyContact'];
    const data = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });
    if (req.file) data.photo = `/${req.file.path.replace(/\\/g, '/')}`;
    await Patient.findByIdAndUpdate(req.session.user.patient, data, { runValidators: true });
    req.flash('success', 'Profile updated successfully');
    res.redirect('/patient');
  } catch (error) {
    next(error);
  }
};
