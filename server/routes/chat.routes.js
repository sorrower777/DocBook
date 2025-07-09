const express = require('express');
const { Message } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// @route   GET /api/chat/conversations
// @desc    Get all conversations for the logged-in user
// @access  Private
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all unique conversations
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ],
          isHelplineMessage: false
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'participant'
        }
      },
      {
        $unwind: '$participant'
      },
      {
        $project: {
          participant: {
            _id: '$participant._id',
            name: '$participant.name',
            email: '$participant.email',
            role: '$participant.role'
          },
          lastMessage: {
            message: '$lastMessage.message',
            createdAt: '$lastMessage.createdAt',
            sender: '$lastMessage.sender'
          },
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({
      success: true,
      data: { conversations }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversations'
    });
  }
});

// @route   GET /api/chat/messages/:userId
// @desc    Get chat messages between current user and specified user
// @access  Private
router.get('/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ],
      isHelplineMessage: false
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('sender', 'name email role')
    .populate('receiver', 'name email role');

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      data: { 
        messages: messages.reverse(), // Reverse to show oldest first
        hasMore: messages.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages'
    });
  }
});

// @route   POST /api/chat/send
// @desc    Send a message (alternative to socket.io)
// @access  Private
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { receiverId, message, messageType = 'text', appointmentId } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and message are required'
      });
    }

    const newMessage = new Message({
      sender: req.user._id,
      receiver: receiverId,
      message,
      messageType,
      appointment: appointmentId || null
    });

    await newMessage.save();

    // Populate sender and receiver info
    await newMessage.populate('sender', 'name email role');
    await newMessage.populate('receiver', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: newMessage }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
});

// @route   GET /api/chat/appointment-messages/:appointmentId
// @desc    Get messages related to a specific appointment
// @access  Private
router.get('/appointment-messages/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user._id;

    const messages = await Message.find({
      appointment: appointmentId,
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'name email role')
    .populate('receiver', 'name email role');

    res.json({
      success: true,
      data: { messages }
    });

  } catch (error) {
    console.error('Get appointment messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointment messages'
    });
  }
});

// @route   DELETE /api/chat/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete their message
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting message'
    });
  }
});

module.exports = router;
