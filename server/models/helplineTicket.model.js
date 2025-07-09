const mongoose = require('mongoose');

const helplineTicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    enum: [
      'technical_support',
      'appointment_help',
      'billing_inquiry',
      'medical_emergency',
      'general_inquiry',
      'complaint',
      'feedback'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Support agent
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false // Internal notes between support agents
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  resolvedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  satisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: {
      type: String,
      maxlength: [500, 'Feedback cannot exceed 500 characters']
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
helplineTicketSchema.index({ user: 1, createdAt: -1 });
helplineTicketSchema.index({ status: 1, priority: 1 });
helplineTicketSchema.index({ category: 1, createdAt: -1 });
helplineTicketSchema.index({ assignedTo: 1, status: 1 });
helplineTicketSchema.index({ ticketId: 1 });

// Populate user and assigned agent info
helplineTicketSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email role'
  }).populate({
    path: 'assignedTo',
    select: 'name email'
  }).populate({
    path: 'messages.sender',
    select: 'name email role'
  });
  next();
});

// Generate ticket ID before saving
helplineTicketSchema.pre('save', function(next) {
  if (!this.ticketId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.ticketId = `TKT-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Update resolved/closed timestamps
helplineTicketSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('HelplineTicket', helplineTicketSchema);
