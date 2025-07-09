const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialty: {
    type: String,
    required: true,
    trim: true
  },
  qualifications: {
    type: [String],
    default: []
  },
  experience: {
    type: Number,
    default: 0 // years
  },
  bio: {
    type: String,
    trim: true
  },
  clinicAddress: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  availableDays: {
    type: [String], // e.g. ['Monday', 'Wednesday']
    default: []
  },
  availableTime: {
    start: { type: String }, // e.g. '09:00'
    end: { type: String }    // e.g. '17:00'
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
