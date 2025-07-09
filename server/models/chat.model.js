const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  isHelplineMessage: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ appointment: 1, createdAt: 1 });
messageSchema.index({ isHelplineMessage: 1, createdAt: -1 });

// Populate sender and receiver info
messageSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'sender',
    select: 'name email role'
  }).populate({
    path: 'receiver',
    select: 'name email role'
  });
  next();
});

module.exports = mongoose.model('Message', messageSchema);
