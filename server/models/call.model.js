const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  callType: {
    type: String,
    enum: ['audio', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'answered', 'ended', 'missed', 'rejected'],
    default: 'initiated'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  callId: {
    type: String,
    required: true,
    unique: true
  },
  roomId: {
    type: String,
    required: true
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  callQuality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for efficient queries
callSchema.index({ caller: 1, createdAt: -1 });
callSchema.index({ receiver: 1, createdAt: -1 });
callSchema.index({ appointment: 1 });
callSchema.index({ status: 1, createdAt: -1 });
callSchema.index({ callId: 1 });

// Populate caller and receiver info
callSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'caller',
    select: 'name email role'
  }).populate({
    path: 'receiver',
    select: 'name email role'
  }).populate({
    path: 'appointment',
    select: 'date timeSlot status'
  });
  next();
});

// Calculate duration before saving
callSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

module.exports = mongoose.model('Call', callSchema);
