const express = require('express');
const { HelplineTicket, Message } = require('../models');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// @route   POST /api/helpline/tickets
// @desc    Create a new helpline ticket
// @access  Private
router.post('/tickets', authenticateToken, async (req, res) => {
  try {
    const { subject, description, category, priority = 'medium' } = req.body;

    if (!subject || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Subject, description, and category are required'
      });
    }

    const ticket = new HelplineTicket({
      user: req.user._id,
      subject,
      description,
      category,
      priority
    });

    await ticket.save();

    // Add initial message to ticket
    ticket.messages.push({
      sender: req.user._id,
      message: description,
      timestamp: new Date()
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Helpline ticket created successfully',
      data: { ticket }
    });

  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating ticket'
    });
  }
});

// @route   GET /api/helpline/tickets
// @desc    Get user's helpline tickets
// @access  Private
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await HelplineTicket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assignedTo', 'name email')
      .populate('messages.sender', 'name email role');

    const totalTickets = await HelplineTicket.countDocuments(query);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalTickets / parseInt(limit)),
          totalTickets,
          hasNext: parseInt(page) * parseInt(limit) < totalTickets,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tickets'
    });
  }
});

// @route   GET /api/helpline/tickets/:ticketId
// @desc    Get specific ticket details
// @access  Private
router.get('/tickets/:ticketId', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await HelplineTicket.findOne({
      $or: [
        { ticketId },
        { _id: ticketId }
      ]
    })
    .populate('user', 'name email role')
    .populate('assignedTo', 'name email')
    .populate('messages.sender', 'name email role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if user owns this ticket or is assigned to it
    if (ticket.user._id.toString() !== req.user._id.toString() && 
        (!ticket.assignedTo || ticket.assignedTo._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { ticket }
    });

  } catch (error) {
    console.error('Get ticket details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching ticket details'
    });
  }
});

// @route   POST /api/helpline/tickets/:ticketId/messages
// @desc    Add message to ticket
// @access  Private
router.post('/tickets/:ticketId/messages', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, isInternal = false } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const ticket = await HelplineTicket.findOne({
      $or: [
        { ticketId },
        { _id: ticketId }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check access
    if (ticket.user.toString() !== req.user._id.toString() && 
        (!ticket.assignedTo || ticket.assignedTo.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add message to ticket
    ticket.messages.push({
      sender: req.user._id,
      message,
      isInternal,
      timestamp: new Date()
    });

    // Update ticket status if it was closed
    if (ticket.status === 'closed') {
      ticket.status = 'open';
    }

    await ticket.save();

    // Populate the new message
    await ticket.populate('messages.sender', 'name email role');

    const newMessage = ticket.messages[ticket.messages.length - 1];

    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      data: { message: newMessage }
    });

  } catch (error) {
    console.error('Add ticket message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding message'
    });
  }
});

// @route   PATCH /api/helpline/tickets/:ticketId/status
// @desc    Update ticket status
// @access  Private
router.patch('/tickets/:ticketId/status', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const ticket = await HelplineTicket.findOne({
      $or: [
        { ticketId },
        { _id: ticketId }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Only ticket owner can close tickets
    if (status === 'closed' && ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only ticket owner can close tickets'
      });
    }

    ticket.status = status;
    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      data: { ticket }
    });

  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating ticket status'
    });
  }
});

// @route   POST /api/helpline/tickets/:ticketId/rate
// @desc    Rate helpline support
// @access  Private
router.post('/tickets/:ticketId/rate', authenticateToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const ticket = await HelplineTicket.findOne({
      $or: [
        { ticketId },
        { _id: ticketId }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Only ticket owner can rate
    if (ticket.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only ticket owner can rate support'
      });
    }

    ticket.satisfaction = {
      rating,
      feedback: feedback || ''
    };

    await ticket.save();

    res.json({
      success: true,
      message: 'Support rated successfully',
      data: { ticket }
    });

  } catch (error) {
    console.error('Rate support error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rating support'
    });
  }
});

// @route   GET /api/helpline/categories
// @desc    Get helpline categories
// @access  Public
router.get('/categories', (req, res) => {
  const categories = [
    {
      value: 'technical_support',
      label: 'Technical Support',
      description: 'Issues with the platform, login problems, bugs'
    },
    {
      value: 'appointment_help',
      label: 'Appointment Help',
      description: 'Booking, rescheduling, or canceling appointments'
    },
    {
      value: 'billing_inquiry',
      label: 'Billing Inquiry',
      description: 'Payment issues, refunds, billing questions'
    },
    {
      value: 'medical_emergency',
      label: 'Medical Emergency',
      description: 'Urgent medical situations requiring immediate attention'
    },
    {
      value: 'general_inquiry',
      label: 'General Inquiry',
      description: 'General questions about services and features'
    },
    {
      value: 'complaint',
      label: 'Complaint',
      description: 'Service complaints or quality issues'
    },
    {
      value: 'feedback',
      label: 'Feedback',
      description: 'Suggestions and feedback for improvement'
    }
  ];

  res.json({
    success: true,
    data: { categories }
  });
});

// @route   GET /api/helpline/quick-help
// @desc    Get quick help articles/FAQs
// @access  Public
router.get('/quick-help', (req, res) => {
  const quickHelp = [
    {
      id: 1,
      title: 'How to book an appointment?',
      content: 'To book an appointment: 1. Browse doctors, 2. Select a doctor, 3. Choose date and time, 4. Confirm booking.',
      category: 'appointment_help'
    },
    {
      id: 2,
      title: 'How to start a video call?',
      content: 'Video calls can be started from your appointment dashboard or by clicking the video call button in chat.',
      category: 'technical_support'
    },
    {
      id: 3,
      title: 'Payment and billing',
      content: 'Payments are processed securely. You can view billing history in your account settings.',
      category: 'billing_inquiry'
    },
    {
      id: 4,
      title: 'Emergency contacts',
      content: 'For medical emergencies, call emergency services immediately or use our emergency helpline feature.',
      category: 'medical_emergency'
    },
    {
      id: 5,
      title: 'Technical requirements for video calls',
      content: 'Ensure you have a stable internet connection, camera, and microphone. Use Chrome or Firefox for best experience.',
      category: 'technical_support'
    }
  ];

  res.json({
    success: true,
    data: { quickHelp }
  });
});

module.exports = router;
