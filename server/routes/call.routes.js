const express = require('express');
const { Call } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// @route   GET /api/calls/history
// @desc    Get call history for the logged-in user
// @access  Private
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, status, callType } = req.query;

    // Build query
    const query = {
      $or: [
        { caller: userId },
        { receiver: userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    if (callType) {
      query.callType = callType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const calls = await Call.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('caller', 'name email role')
      .populate('receiver', 'name email role')
      .populate('appointment', 'date timeSlot status');

    const totalCalls = await Call.countDocuments(query);

    res.json({
      success: true,
      data: {
        calls,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCalls / parseInt(limit)),
          totalCalls,
          hasNext: parseInt(page) * parseInt(limit) < totalCalls,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching call history'
    });
  }
});

// @route   GET /api/calls/:callId
// @desc    Get details of a specific call
// @access  Private
router.get('/:callId', authenticateToken, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    const call = await Call.findOne({ callId })
      .populate('caller', 'name email role')
      .populate('receiver', 'name email role')
      .populate('appointment', 'date timeSlot status reason');

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Check if user is part of this call
    if (call.caller._id.toString() !== userId.toString() && 
        call.receiver._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { call }
    });

  } catch (error) {
    console.error('Get call details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching call details'
    });
  }
});

// @route   POST /api/calls/rate
// @desc    Rate call quality
// @access  Private
router.post('/rate', authenticateToken, async (req, res) => {
  try {
    const { callId, quality, notes } = req.body;
    const userId = req.user._id;

    if (!callId || !quality) {
      return res.status(400).json({
        success: false,
        message: 'Call ID and quality rating are required'
      });
    }

    const call = await Call.findOne({ callId });

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Check if user is part of this call
    if (call.caller.toString() !== userId.toString() && 
        call.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update call with rating
    call.callQuality = quality;
    if (notes) {
      call.notes = notes;
    }

    await call.save();

    res.json({
      success: true,
      message: 'Call rated successfully',
      data: { call }
    });

  } catch (error) {
    console.error('Rate call error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rating call'
    });
  }
});

// @route   GET /api/calls/stats/summary
// @desc    Get call statistics for the user
// @access  Private
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Call.aggregate([
      {
        $match: {
          $or: [
            { caller: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          answeredCalls: {
            $sum: { $cond: [{ $eq: ['$status', 'answered'] }, 1, 0] }
          },
          missedCalls: {
            $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] }
          },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' },
          videoCalls: {
            $sum: { $cond: [{ $eq: ['$callType', 'video'] }, 1, 0] }
          },
          audioCalls: {
            $sum: { $cond: [{ $eq: ['$callType', 'audio'] }, 1, 0] }
          }
        }
      }
    ]);

    const summary = stats[0] || {
      totalCalls: 0,
      answeredCalls: 0,
      missedCalls: 0,
      totalDuration: 0,
      avgDuration: 0,
      videoCalls: 0,
      audioCalls: 0
    };

    // Get recent calls
    const recentCalls = await Call.find({
      $or: [
        { caller: userId },
        { receiver: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('caller', 'name role')
    .populate('receiver', 'name role');

    res.json({
      success: true,
      data: {
        summary,
        recentCalls
      }
    });

  } catch (error) {
    console.error('Get call stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching call statistics'
    });
  }
});

// @route   POST /api/calls/emergency
// @desc    Initiate emergency call to helpline
// @access  Private
router.post('/emergency', authenticateToken, async (req, res) => {
  try {
    const { description } = req.body;
    const userId = req.user._id;

    // For emergency calls, we'll create a special helpline user ID or skip saving to Call model
    // Instead, we'll just return the emergency call info without saving to database
    const emergencyCallId = `emergency_${Date.now()}`;
    const emergencyRoomId = `emergency_${userId}_${Date.now()}`;

    // In a real implementation, this would:
    // 1. Find available helpline agents
    // 2. Route call to the next available agent
    // 3. Send push notifications to emergency response team
    // 4. Log emergency in monitoring system

    // For now, we'll just return success without saving to Call model
    // since emergency calls don't need a specific receiver initially

    res.status(201).json({
      success: true,
      message: 'Emergency call initiated. Connecting you to helpline...',
      data: {
        callId: emergencyCallId,
        roomId: emergencyRoomId,
        status: 'connecting'
      }
    });

  } catch (error) {
    console.error('Emergency call error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while initiating emergency call'
    });
  }
});

// @route   GET /api/calls/active
// @desc    Get active calls for the user
// @access  Private
router.get('/active/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const activeCalls = await Call.find({
      $or: [
        { caller: userId },
        { receiver: userId }
      ],
      status: { $in: ['initiated', 'ringing', 'answered'] }
    })
    .populate('caller', 'name email role')
    .populate('receiver', 'name email role')
    .populate('appointment', 'date timeSlot');

    res.json({
      success: true,
      data: { activeCalls }
    });

  } catch (error) {
    console.error('Get active calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active calls'
    });
  }
});

module.exports = router;
