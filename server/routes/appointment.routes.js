const express = require('express');
const { Appointment, DoctorProfile, User } = require('../models');
const { authenticateToken, requireRole, requireVerifiedDoctor } = require('../middleware/auth.middleware');

const router = express.Router();

// Helper function to generate time slots
const generateTimeSlots = (startTime, endTime, slotDuration = 30) => {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentTime = startHour * 60 + startMin;
  const endTimeMinutes = endHour * 60 + endMin;
  
  while (currentTime < endTimeMinutes) {
    const hours = Math.floor(currentTime / 60);
    const minutes = currentTime % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    slots.push(timeString);
    currentTime += slotDuration;
  }
  
  return slots;
};

// @route   GET /api/appointments/available-slots/:doctorId
// @desc    Get available time slots for a doctor on a specific date
// @access  Public
router.get('/available-slots/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const appointmentDate = new Date(date);
    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ user: doctorId });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Find availability for the requested day
    const dayAvailability = doctorProfile.availability.find(avail => avail.day === dayName);
    
    if (!dayAvailability || !dayAvailability.isAvailable) {
      return res.json({
        success: true,
        data: { availableSlots: [] }
      });
    }

    // Generate all possible time slots
    const allSlots = generateTimeSlots(dayAvailability.startTime, dayAvailability.endTime);

    // Get existing appointments for this doctor on this date
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date: {
        $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
        $lt: new Date(appointmentDate.setHours(23, 59, 59, 999))
      },
      status: { $in: ['pending', 'confirmed'] }
    }).select('timeSlot');

    const bookedSlots = existingAppointments.map(apt => apt.timeSlot);
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({
      success: true,
      data: { availableSlots }
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available slots'
    });
  }
});

// @route   POST /api/appointments/book
// @desc    Book a new appointment
// @access  Private (Patient only)
router.post('/book', authenticateToken, requireRole('patient'), async (req, res) => {
  try {
    const { doctorId, date, timeSlot, reason } = req.body;

    // Validate required fields
    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, date, and time slot are required'
      });
    }

    // Check if doctor exists and is verified
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor' || !doctor.isVerified) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not verified'
      });
    }

    const appointmentDate = new Date(date);
    
    // Check if date is in the future
    if (appointmentDate < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book appointments for past dates'
      });
    }

    // Check if time slot is available
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date: {
        $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
        $lt: new Date(appointmentDate.setHours(23, 59, 59, 999))
      },
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Create appointment
    const appointment = new Appointment({
      doctor: doctorId,
      patient: req.user._id,
      date: appointmentDate,
      timeSlot,
      reason: reason || ''
    });

    await appointment.save();

    // Populate the appointment with doctor and patient details
    await appointment.populate([
      { path: 'doctor', select: 'name email' },
      { path: 'patient', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Book appointment error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while booking appointment'
    });
  }
});

// @route   GET /api/appointments/my-appointments
// @desc    Get all appointments for the logged-in user
// @access  Private
router.get('/my-appointments', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build query based on user role
    const query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const appointments = await Appointment.find(query)
      .populate([
        { path: 'doctor', select: 'name email' },
        { path: 'patient', select: 'name email' }
      ])
      .sort({ date: 1, timeSlot: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalAppointments = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalAppointments / parseInt(limit)),
          totalAppointments,
          hasNext: parseInt(page) * parseInt(limit) < totalAppointments,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments'
    });
  }
});

// @route   PATCH /api/appointments/:id/cancel
// @desc    Cancel an appointment
// @access  Private (Patient only - own appointments)
router.patch('/:id/cancel', authenticateToken, requireRole('patient'), async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment belongs to the patient
    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own appointments'
      });
    }

    // Check if appointment can be cancelled
    if (!appointment.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be cancelled (must be at least 2 hours before appointment time)'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user._id;
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = cancellationReason || '';

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling appointment'
    });
  }
});

// @route   PATCH /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private (Doctor only - own appointments)
router.patch('/:id/status', authenticateToken, requireRole('doctor'), requireVerifiedDoctor, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment belongs to the doctor
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own appointments'
      });
    }

    appointment.status = status;
    if (notes !== undefined) {
      appointment.notes = notes;
    }

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: { appointment }
    });

  } catch (error) {
    console.error('Update appointment status error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating appointment status'
    });
  }
});

module.exports = router;
