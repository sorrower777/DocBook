import React, { useState, useEffect } from 'react';
import { appointmentAPI, doctorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsResponse, profileResponse] = await Promise.all([
        appointmentAPI.getMyAppointments(),
        doctorAPI.getMyProfile()
      ]);
      
      setAppointments(appointmentsResponse.data.data.appointments);
      setDoctorProfile(profileResponse.data.data.doctorProfile);
    } catch (error) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus, notes = '') => {
    try {
      setUpdatingStatus(appointmentId);
      await appointmentAPI.updateAppointmentStatus(appointmentId, newStatus, notes);
      
      // Update the appointment in the local state
      setAppointments(appointments.map(apt => 
        apt._id === appointmentId 
          ? { ...apt, status: newStatus, notes }
          : apt
      ));
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update appointment status';
      console.error('Error updating appointment status:', errorMessage);
      setError(errorMessage);

      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (date, timeSlot) => {
    const appointmentDateTime = new Date(date);
    const [hours, minutes] = timeSlot.split(':');
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return appointmentDateTime > new Date();
  };

  const upcomingAppointments = appointments.filter(apt => 
    isUpcoming(apt.date, apt.timeSlot) && ['pending', 'confirmed'].includes(apt.status)
  );

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toDateString();
    const appointmentDate = new Date(apt.date).toDateString();
    return today === appointmentDate && ['pending', 'confirmed'].includes(apt.status);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user.isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Verification</h2>
          <p className="text-gray-600 mb-4">
            Your doctor account is pending admin verification. You'll be able to manage appointments once verified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, Dr. {user?.name}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{todayAppointments.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingAppointments.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Consultation Fee</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${doctorProfile?.consultationFee || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Today's Appointments */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Today's Appointments ({todayAppointments.length})
            </h2>
            
            {todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {appointment.patient.name}
                        </h3>
                        <p className="text-gray-600 text-sm">{appointment.patient.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">⏰</span>
                        {appointment.timeSlot}
                      </div>
                      {appointment.reason && (
                        <div className="flex items-start text-sm text-gray-600">
                          <span className="mr-2 mt-0.5">📝</span>
                          <span>{appointment.reason}</span>
                        </div>
                      )}
                    </div>

                    {appointment.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                          disabled={updatingStatus === appointment._id}
                          className="btn-primary text-sm disabled:opacity-50"
                        >
                          {updatingStatus === appointment._id ? 'Updating...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                          disabled={updatingStatus === appointment._id}
                          className="btn-danger text-sm disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {appointment.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                        disabled={updatingStatus === appointment._id}
                        className="btn-secondary text-sm disabled:opacity-50"
                      >
                        {updatingStatus === appointment._id ? 'Updating...' : 'Mark Complete'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📅</div>
                <p className="text-gray-600">No appointments today</p>
              </div>
            )}
          </div>

          {/* All Upcoming Appointments */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              All Upcoming Appointments ({upcomingAppointments.length})
            </h2>
            
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {appointment.patient.name}
                        </h3>
                        <p className="text-gray-600 text-sm">{appointment.patient.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">📅</span>
                        {formatDate(appointment.date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">⏰</span>
                        {appointment.timeSlot}
                      </div>
                      {appointment.reason && (
                        <div className="flex items-start text-sm text-gray-600">
                          <span className="mr-2 mt-0.5">📝</span>
                          <span>{appointment.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <p className="text-gray-600">No upcoming appointments</p>
              </div>
            )}
          </div>
        </div>

        {/* Profile Summary */}
        {doctorProfile && (
          <div className="mt-8 card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Summary</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Specialty</h3>
                <p className="text-gray-600">{doctorProfile.specialty}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Experience</h3>
                <p className="text-gray-600">{doctorProfile.experience} years</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="font-medium text-gray-900 mb-2">Qualifications</h3>
                <p className="text-gray-600">
                  {Array.isArray(doctorProfile.qualifications)
                    ? doctorProfile.qualifications.join(', ')
                    : doctorProfile.qualifications}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
