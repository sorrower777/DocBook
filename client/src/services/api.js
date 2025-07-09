import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
};

// Doctor API calls
export const doctorAPI = {
  getAllDoctors: (params) => api.get('/doctors', { params }),
  getDoctorById: (id) => api.get(`/doctors/${id}`),
  getSpecialties: () => api.get('/doctors/specialties'),
  getMyProfile: () => api.get('/doctors/profile/me'),
  updateProfile: (data) => api.put('/doctors/profile', data),
  updateAvailability: (availability) => api.put('/doctors/availability', { availability }),
};

// Appointment API calls
export const appointmentAPI = {
  getAvailableSlots: (doctorId, date) =>
    api.get(`/appointments/available-slots/${doctorId}`, { params: { date } }),
  bookAppointment: (appointmentData) => api.post('/appointments/book', appointmentData),
  getMyAppointments: (params) => api.get('/appointments/my-appointments', { params }),
  cancelAppointment: (id, reason) =>
    api.patch(`/appointments/${id}/cancel`, { cancellationReason: reason }),
  updateAppointmentStatus: (id, status, notes) =>
    api.patch(`/appointments/${id}/status`, { status, notes }),
};

// Chat API calls
export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (userId, params) => api.get(`/chat/messages/${userId}`, { params }),
  sendMessage: (messageData) => api.post('/chat/send', messageData),
  getAppointmentMessages: (appointmentId) => api.get(`/chat/appointment-messages/${appointmentId}`),
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}`),
};

// Call API calls
export const callAPI = {
  getCallHistory: (params) => api.get('/calls/history', { params }),
  getCallDetails: (callId) => api.get(`/calls/${callId}`),
  rateCall: (callData) => api.post('/calls/rate', callData),
  getCallStats: () => api.get('/calls/stats/summary'),
  initiateEmergencyCall: (description) => api.post('/calls/emergency', { description }),
  getActiveCalls: () => api.get('/calls/active/list'),
};

// Helpline API calls
export const helplineAPI = {
  createTicket: (ticketData) => api.post('/helpline/tickets', ticketData),
  getTickets: (params) => api.get('/helpline/tickets', { params }),
  getTicketDetails: (ticketId) => api.get(`/helpline/tickets/${ticketId}`),
  addTicketMessage: (ticketId, messageData) => api.post(`/helpline/tickets/${ticketId}/messages`, messageData),
  updateTicketStatus: (ticketId, status) => api.patch(`/helpline/tickets/${ticketId}/status`, { status }),
  rateSupport: (ticketId, ratingData) => api.post(`/helpline/tickets/${ticketId}/rate`, ratingData),
  getCategories: () => api.get('/helpline/categories'),
  getQuickHelp: () => api.get('/helpline/quick-help'),
};

export default api;
