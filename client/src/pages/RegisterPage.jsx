import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorAPI } from '../services/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    // Doctor specific fields
    specialty: '',
    qualifications: '',
    experienceInYears: '',
    consultationFee: '',
  });
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const { register, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Fetch specialties for doctors
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await doctorAPI.getSpecialties();
        setSpecialties(response.data.data.specialties);
      } catch (error) {
        console.error('Error fetching specialties:', error);
      }
    };
    fetchSpecialties();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    // Basic validation
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Doctor specific validation
    if (formData.role === 'doctor') {
      if (!formData.specialty) errors.specialty = 'Specialty is required';
      if (!formData.qualifications.trim()) errors.qualifications = 'Qualifications are required';
      if (!formData.experienceInYears) errors.experienceInYears = 'Experience is required';
      if (!formData.consultationFee) errors.consultationFee = 'Consultation fee is required';
      
      if (formData.experienceInYears && (formData.experienceInYears < 0 || formData.experienceInYears > 50)) {
        errors.experienceInYears = 'Experience must be between 0 and 50 years';
      }
      
      if (formData.consultationFee && formData.consultationFee < 0) {
        errors.consultationFee = 'Consultation fee cannot be negative';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // Prepare data for submission
    const submitData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role,
    };

    // Add doctor specific fields
    if (formData.role === 'doctor') {
      submitData.specialty = formData.specialty;
      submitData.qualifications = formData.qualifications.trim();
      submitData.experienceInYears = parseInt(formData.experienceInYears);
      submitData.consultationFee = parseFloat(formData.consultationFee);
    }

    const result = await register(submitData);
    
    if (result.success) {
      navigate('/');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-gray-600">
            Join DocBook to manage your healthcare
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="patient"
                    checked={formData.role === 'patient'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Patient
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="doctor"
                    checked={formData.role === 'doctor'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Doctor
                </label>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${validationErrors.name ? 'border-red-500' : ''}`}
                placeholder="Enter your full name"
              />
              {validationErrors.name && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${validationErrors.email ? 'border-red-500' : ''}`}
                placeholder="Enter your email"
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`input-field ${validationErrors.password ? 'border-red-500' : ''}`}
                placeholder="Enter your password"
              />
              {validationErrors.password && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input-field ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Confirm your password"
              />
              {validationErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* Doctor Specific Fields */}
            {formData.role === 'doctor' && (
              <>
                <div>
                  <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
                    Specialty
                  </label>
                  <select
                    id="specialty"
                    name="specialty"
                    required
                    value={formData.specialty}
                    onChange={handleChange}
                    className={`input-field ${validationErrors.specialty ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select your specialty</option>
                    {specialties.map(specialty => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                  {validationErrors.specialty && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.specialty}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700">
                    Qualifications
                  </label>
                  <textarea
                    id="qualifications"
                    name="qualifications"
                    required
                    value={formData.qualifications}
                    onChange={handleChange}
                    rows={3}
                    className={`input-field ${validationErrors.qualifications ? 'border-red-500' : ''}`}
                    placeholder="Enter your qualifications (e.g., MBBS, MD, etc.)"
                  />
                  {validationErrors.qualifications && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.qualifications}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="experienceInYears" className="block text-sm font-medium text-gray-700">
                      Experience (Years)
                    </label>
                    <input
                      id="experienceInYears"
                      name="experienceInYears"
                      type="number"
                      min="0"
                      max="50"
                      required
                      value={formData.experienceInYears}
                      onChange={handleChange}
                      className={`input-field ${validationErrors.experienceInYears ? 'border-red-500' : ''}`}
                      placeholder="0"
                    />
                    {validationErrors.experienceInYears && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.experienceInYears}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="consultationFee" className="block text-sm font-medium text-gray-700">
                      Consultation Fee ($)
                    </label>
                    <input
                      id="consultationFee"
                      name="consultationFee"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.consultationFee}
                      onChange={handleChange}
                      className={`input-field ${validationErrors.consultationFee ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                    />
                    {validationErrors.consultationFee && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.consultationFee}</p>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> Doctor accounts require admin verification before you can start accepting appointments.
                  </p>
                </div>
              </>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>

          {/* Sign in link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
