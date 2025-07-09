import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiMessageCircle, FiVideo, FiPhone } from 'react-icons/fi';
import { doctorAPI } from '../services/api';
import BookingForm from '../components/BookingForm';
import CommunicationDashboard from '../components/CommunicationDashboard';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const DoctorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showCommunications, setShowCommunications] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const { initiateCall } = useSocket();

  useEffect(() => {
    fetchDoctorProfile();
  }, [id]);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      const response = await doctorAPI.getDoctorById(id);
      setDoctor(response.data.data.doctor);
    } catch (error) {
      setError('Doctor not found or not available');
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSuccess = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
    }, 5000);
  };



  const handleStartCall = (callType) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    initiateCall(doctor.user._id, callType);
  };

  const handleStartChat = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowCommunications(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Doctor Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {bookingSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-green-600 mr-3">✅</div>
              <div>
                <h4 className="text-green-800 font-semibold">Appointment Booked Successfully!</h4>
                <p className="text-green-700 text-sm">
                  Your appointment has been booked. You can view it in your dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Doctor Information */}
          <div className="lg:col-span-2">
            <div className="card">
              {/* Doctor Header */}
              <div className="flex items-start space-x-6 mb-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  {doctor.profileImage ? (
                    <img 
                      src={doctor.profileImage} 
                      alt={doctor.user.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-semibold text-gray-600">
                      {doctor.user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Dr. {doctor.user.name}
                  </h1>
                  
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                      {doctor.specialty}
                    </span>
                    <span className="text-gray-600">
                      {doctor.experience} years experience
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">Available for appointments</span>
                  </div>

                  <div className="text-2xl font-bold text-gray-900">
                    ${doctor.consultationFee}
                    <span className="text-base font-normal text-gray-600 ml-1">
                      consultation fee
                    </span>
                  </div>

                  {/* Quick Communication Actions */}
                  {isAuthenticated && user?.role === 'patient' && (
                    <div className="flex items-center space-x-2 mt-4">
                      <button
                        onClick={handleStartChat}
                        className="flex items-center space-x-2 px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                        title="Start chat"
                      >
                        <FiMessageCircle size={16} />
                        <span className="text-sm">Chat</span>
                      </button>
                      <button
                        onClick={() => handleStartCall('audio')}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        title="Audio call"
                      >
                        <FiPhone size={16} />
                        <span className="text-sm">Call</span>
                      </button>
                      <button
                        onClick={() => handleStartCall('video')}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Video call"
                      >
                        <FiVideo size={16} />
                        <span className="text-sm">Video</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Qualifications */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Qualifications</h3>
                <p className="text-gray-700 leading-relaxed">
                  {Array.isArray(doctor.qualifications)
                    ? doctor.qualifications.join(', ')
                    : doctor.qualifications}
                </p>
              </div>

              {/* About */}
              {doctor.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {doctor.bio}
                  </p>
                </div>
              )}

              {/* Availability */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Availability</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {doctor.availableDays && doctor.availableDays.length > 0 ? (
                    doctor.availableDays.map((day) => (
                      <div
                        key={day}
                        className="p-3 rounded-lg border bg-green-50 border-green-200"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">{day}</span>
                          <span className="text-green-600 text-sm">
                            {doctor.availableTime?.start || '09:00'} - {doctor.availableTime?.end || '17:00'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-3 rounded-lg border bg-gray-50 border-gray-200">
                      <span className="text-gray-500">Availability information not provided</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-500">📧</span>
                    <span className="text-gray-700">{doctor.user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <BookingForm 
                doctorId={doctor.user._id} 
                onBookingSuccess={handleBookingSuccess}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Communication Dashboard */}
      <CommunicationDashboard
        isOpen={showCommunications}
        onClose={() => setShowCommunications(false)}
        initialReceiver={doctor?.user}
      />
    </div>
  );
};

export default DoctorProfilePage;
