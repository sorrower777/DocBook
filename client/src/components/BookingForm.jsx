import React, { useState, useEffect } from 'react';
import { appointmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BookingForm = ({ doctorId, onBookingSuccess }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { isAuthenticated, user } = useAuth();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate, doctorId]);

  const fetchAvailableSlots = async () => {
    try {
      setSlotsLoading(true);
      setError('');
      const response = await appointmentAPI.getAvailableSlots(doctorId, selectedDate);
      setAvailableSlots(response.data.data.availableSlots);
      setSelectedTimeSlot(''); // Reset selected time slot
    } catch (error) {
      setError('Failed to fetch available slots');
      console.error('Error fetching slots:', error);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('Please login to book an appointment');
      return;
    }

    if (user.role !== 'patient') {
      setError('Only patients can book appointments');
      return;
    }

    if (!selectedDate || !selectedTimeSlot) {
      setError('Please select date and time slot');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const appointmentData = {
        doctorId,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        reason: reason.trim()
      };

      await appointmentAPI.bookAppointment(appointmentData);
      
      // Reset form
      setSelectedDate('');
      setSelectedTimeSlot('');
      setReason('');
      setAvailableSlots([]);
      
      if (onBookingSuccess) {
        onBookingSuccess();
      }
      
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Book Appointment</h3>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Please login to book an appointment</p>
          <a href="/login" className="btn-primary">
            Login
          </a>
        </div>
      </div>
    );
  }

  if (user.role !== 'patient') {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Book Appointment</h3>
        <div className="text-center py-8">
          <p className="text-gray-600">Only patients can book appointments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Book Appointment</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Date Selection */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Select Date
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={today}
            className="input-field"
            required
          />
        </div>

        {/* Time Slot Selection */}
        {selectedDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Available Time Slots
            </label>
            
            {slotsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`p-2 text-sm border rounded-lg transition-colors ${
                      selectedTimeSlot === slot
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-4">
                No available slots for this date
              </p>
            )}
          </div>
        )}

        {/* Reason for Visit */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Visit (Optional)
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="input-field"
            placeholder="Describe your symptoms or reason for the visit..."
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {reason.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedDate || !selectedTimeSlot}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Booking...
            </div>
          ) : (
            'Book Appointment'
          )}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
