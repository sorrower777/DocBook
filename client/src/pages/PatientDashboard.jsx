import React, { useState, useEffect } from 'react';
import { appointmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentAPI.getMyAppointments();
      setAppointments(response.data.data.appointments);
    } catch (error) {
      setError('Failed to fetch appointments');
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setCancellingId(appointmentId);
      console.log('Cancelling appointment:', appointmentId);
      await appointmentAPI.cancelAppointment(appointmentId, 'Cancelled by patient');
      
      // Update the appointment in the local state
      setAppointments(appointments.map(apt => 
        apt._id === appointmentId 
          ? { ...apt, status: 'cancelled' }
          : apt
      ));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancellingId(null);
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

  const pastAppointments = appointments.filter(apt => 
    !isUpcoming(apt.date, apt.timeSlot) || ['cancelled', 'completed'].includes(apt.status)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upcoming Appointments ({upcomingAppointments.length})
            </h2>
            
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Dr. {appointment.doctor.name}
                        </h3>
                        <p className="text-gray-600 text-sm">{appointment.doctor.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
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

                    {['pending', 'confirmed'].includes(appointment.status) && (
                      <button
                        onClick={() => handleCancelAppointment(appointment._id)}
                        disabled={cancellingId === appointment._id}
                        className="btn-danger text-sm disabled:opacity-50"
                      >
                        {cancellingId === appointment._id ? 'Cancelling...' : 'Cancel Appointment'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📅</div>
                <p className="text-gray-600">No upcoming appointments</p>
                <a href="/" className="btn-primary mt-4 inline-block">
                  Book New Appointment
                </a>
              </div>
            )}
          </div>

          {/* Past Appointments */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Past Appointments ({pastAppointments.length})
            </h2>
            
            {pastAppointments.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {pastAppointments.map((appointment) => (
                  <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Dr. {appointment.doctor.name}
                        </h3>
                        <p className="text-gray-600 text-sm">{appointment.doctor.email}</p>
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
                      {appointment.notes && (
                        <div className="flex items-start text-sm text-gray-600">
                          <span className="mr-2 mt-0.5">📋</span>
                          <span>{appointment.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <p className="text-gray-600">No past appointments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
