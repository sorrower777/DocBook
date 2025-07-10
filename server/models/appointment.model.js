const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ patient: 1, date: 1 });
appointmentSchema.index({ status: 1, date: 1 });

// Populate patient and doctor info
appointmentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'patient',
    select: 'name email'
  }).populate({
    path: 'doctor',
    select: 'name email'
  });
  next();
});

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  // Can only cancel pending or confirmed appointments
  if (!['pending', 'confirmed'].includes(this.status)) {
    return false;
  }

  // Check if appointment is at least 2 hours in the future
  const appointmentDateTime = new Date(this.date);
  const [hours, minutes] = this.timeSlot.split(':');
  appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));

  return appointmentDateTime > twoHoursFromNow;
};

module.exports = mongoose.model('Appointment', appointmentSchema);