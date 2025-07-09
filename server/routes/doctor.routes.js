const express = require('express');
const { DoctorProfile, User } = require('../models');
const { authenticateToken, requireRole, requireVerifiedDoctor } = require('../middleware/auth.middleware');

const router = express.Router();

// @route   GET /api/doctors
// @desc    Get all verified doctors with optional specialty filter
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { specialty, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    // Add specialty filter if provided
    if (specialty) {
      query.specialty = { $regex: specialty, $options: 'i' };
    }

    // Only show verified doctors
    const userQuery = { isVerified: true, role: 'doctor' };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get doctors with pagination
    const doctors = await DoctorProfile.find(query)
      .populate({
        path: 'user',
        // match: userQuery,
        // select: 'name email isVerified'
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    // Filter out doctors where user is null (not verified)
    const verifiedDoctors = doctors.filter(doctor => doctor.user !== null);

    // Get total count for pagination
    const totalDoctors = await DoctorProfile.countDocuments(query);

    res.json({
      success: true,
      data: {
        doctors: verifiedDoctors,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalDoctors / parseInt(limit)),
          totalDoctors: verifiedDoctors.length,
          hasNext: parseInt(page) * parseInt(limit) < totalDoctors,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctors'
    });
  }
});

// @route   GET /api/doctors/specialties
// @desc    Get all available specialties
// @access  Public
router.get('/specialties', async (req, res) => {
  try {
    const specialties = [
      'Cardiology',
      'Dermatology', 
      'Endocrinology',
      'Gastroenterology',
      'General Medicine',
      'Neurology',
      'Oncology',
      'Orthopedics',
      'Pediatrics',
      'Psychiatry',
      'Radiology',
      'Surgery',
      'Urology'
    ];

    res.json({
      success: true,
      data: { specialties }
    });

  } catch (error) {
    console.error('Get specialties error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching specialties'
    });
  }
});

// @route   GET /api/doctors/:id
// @desc    Get single doctor profile
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await DoctorProfile.findById(id)
      .populate({
        path: 'user',
        select: 'name email isVerified'
      });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // if (!doctor.user.isVerified) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Doctor not available'
    //   });
    // }

    res.json({
      success: true,
      data: { doctor }
    });

  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctor'
    });
  }
});

// @route   GET /api/doctors/profile/me
// @desc    Get current doctor's profile
// @access  Private (Doctor only)
router.get('/profile/me', authenticateToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorProfile = await DoctorProfile.findOne({ user: req.user._id })
      .populate({
        path: 'user',
        select: 'name email isVerified'
      });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    res.json({
      success: true,
      data: { doctorProfile }
    });

  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/doctors/profile
// @desc    Update doctor profile
// @access  Private (Doctor only)
router.put('/profile', authenticateToken, requireRole('doctor'), async (req, res) => {
  try {
    const { specialty, qualifications, experience, consultationFee, bio, profileImage } = req.body;

    const doctorProfile = await DoctorProfile.findOne({ user: req.user._id });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Update fields if provided
    if (specialty) doctorProfile.specialty = specialty;
    if (qualifications) doctorProfile.qualifications = qualifications;
    if (experience !== undefined) doctorProfile.experience = experience;
    if (consultationFee !== undefined) doctorProfile.consultationFee = consultationFee;
    if (bio !== undefined) doctorProfile.bio = bio;
    if (profileImage !== undefined) doctorProfile.profileImage = profileImage;

    await doctorProfile.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { doctorProfile }
    });

  } catch (error) {
    console.error('Update doctor profile error:', error);
    
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
      message: 'Server error while updating profile'
    });
  }
});

// @route   PUT /api/doctors/availability
// @desc    Update doctor availability
// @access  Private (Doctor only)
router.put('/availability', authenticateToken, requireRole('doctor'), requireVerifiedDoctor, async (req, res) => {
  try {
    const { availableDays, availableTime } = req.body;

    if (!availableDays || !Array.isArray(availableDays)) {
      return res.status(400).json({
        success: false,
        message: 'Available days must be an array'
      });
    }

    const doctorProfile = await DoctorProfile.findOne({ user: req.user._id });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    doctorProfile.availableDays = availableDays;
    if (availableTime) {
      doctorProfile.availableTime = availableTime;
    }
    await doctorProfile.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        availableDays: doctorProfile.availableDays,
        availableTime: doctorProfile.availableTime
      }
    });

  } catch (error) {
    console.error('Update availability error:', error);
    
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
      message: 'Server error while updating availability'
    });
  }
});

module.exports = router;
