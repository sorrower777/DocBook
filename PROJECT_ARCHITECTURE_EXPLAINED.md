# 🏗️ Complete Project Architecture Explanation

## 📁 **Project Structure Overview**

```
doctor-appointment-system/
├── server/                 # Backend (Node.js + Express + MongoDB)
│   ├── models/            # Database schemas (what data looks like)
│   ├── routes/            # API endpoints (how frontend talks to backend)
│   ├── middleware/        # Security and validation functions
│   ├── socket/            # Real-time communication setup
│   └── server.js          # Main server file (starts everything)
├── client/                # Frontend (React + Tailwind CSS)
│   ├── src/
│   │   ├── components/    # Reusable UI pieces
│   │   ├── pages/         # Full page components
│   │   ├── context/       # Global state management
│   │   ├── services/      # API communication functions
│   │   └── hooks/         # Custom React functionality
└── README.md              # Project documentation
```

## 🔄 **How Files Connect to Each Other**

### **Data Flow Diagram**
```
User Browser (Frontend)
    ↕️ (HTTP Requests)
Express Server (Backend)
    ↕️ (Database Queries)
MongoDB Database
    ↕️ (Real-time Events)
Socket.io (Real-time Communication)
```

### **File Connection Map**
```
Frontend → Backend → Database
React Components → API Routes → MongoDB Models
Socket.io Client → Socket.io Server → Database
```

## 🎯 **Backend Files Explained**

### **1. server/server.js** (Main Server File)
**Purpose**: Starts the entire backend server
**What it does**:
- Creates Express app (web server)
- Connects to MongoDB database
- Sets up Socket.io for real-time communication
- Defines API routes
- Starts server on port 5000

**Key Lines Explained**:
```javascript
const express = require('express');        // Import web server framework
const mongoose = require('mongoose');      // Import database connection tool
const cors = require('cors');              // Allow frontend to talk to backend
const http = require('http');              // Create HTTP server
const app = express();                     // Create web application
const server = http.createServer(app);     // Create server that can handle Socket.io
const io = initializeSocket(server);       // Add real-time communication
app.use('/api/auth', authRoutes);          // Handle login/register requests
server.listen(PORT, () => {...});          // Start server and listen for requests
```

### **2. server/models/** (Database Schemas)

#### **user.model.js** - User Information
**Purpose**: Defines what user data looks like in database
**Contains**: Name, email, password, role (patient/doctor)
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },     // User's full name
  email: { type: String, required: true },    // Login email
  password: { type: String, required: true }, // Encrypted password
  role: { type: String, enum: ['patient', 'doctor'] } // User type
});
```

#### **doctorProfile.model.js** - Doctor Details
**Purpose**: Extra information for doctors only
**Contains**: Specialty, qualifications, experience, fees, availability
```javascript
const doctorProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Links to user
  specialty: { type: String, required: true },    // Medical specialty
  qualifications: { type: String, required: true }, // Degrees/certificates
  experienceInYears: { type: Number, required: true }, // Years of practice
  consultationFee: { type: Number, required: true },   // Price per consultation
  availability: [{ // When doctor is available
    day: String,      // Monday, Tuesday, etc.
    startTime: String, // 09:00
    endTime: String,   // 17:00
    isAvailable: Boolean // true/false
  }]
});
```

#### **appointment.model.js** - Appointment Bookings
**Purpose**: Stores all appointment information
**Contains**: Patient, doctor, date, time, status, reason
```javascript
const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who booked
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Which doctor
  date: { type: Date, required: true },        // Appointment date
  timeSlot: { type: String, required: true },  // Time like "10:00-11:00"
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'] },
  reason: { type: String },                     // Why patient needs appointment
  notes: { type: String }                      // Doctor's notes after appointment
});
```

#### **chat.model.js** - Chat Messages
**Purpose**: Stores all chat messages between users
**Contains**: Sender, receiver, message content, timestamp
```javascript
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },   // Who sent
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who receives
  message: { type: String, required: true },    // Message content
  messageType: { type: String, enum: ['text', 'image', 'file'] }, // Type of message
  isRead: { type: Boolean, default: false },    // Has receiver seen it?
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' } // Related appointment
});
```

#### **call.model.js** - Call Records
**Purpose**: Stores information about audio/video calls
**Contains**: Caller, receiver, call type, duration, status
```javascript
const callSchema = new mongoose.Schema({
  caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },    // Who called
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Who was called
  callType: { type: String, enum: ['audio', 'video'] },  // Audio or video call
  status: { type: String, enum: ['initiated', 'answered', 'ended', 'missed'] },
  startTime: { type: Date, default: Date.now },          // When call started
  endTime: { type: Date },                               // When call ended
  duration: { type: Number, default: 0 },               // Call length in seconds
  callId: { type: String, required: true, unique: true } // Unique call identifier
});
```

#### **helplineTicket.model.js** - Support Tickets
**Purpose**: Stores support requests from users
**Contains**: User, subject, description, category, status, messages
```javascript
const helplineTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who needs help
  subject: { type: String, required: true },           // Ticket title
  description: { type: String, required: true },       // Problem description
  category: { type: String, enum: ['technical_support', 'billing', 'emergency'] },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'] },
  messages: [{ // Conversation between user and support
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
});
```

### **3. server/routes/** (API Endpoints)

#### **auth.routes.js** - Login/Register
**Purpose**: Handles user authentication
**Endpoints**:
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login to account
- `GET /api/auth/me` - Get current user info

**Key Functions**:
```javascript
// Register new user
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;  // Get data from frontend
  const hashedPassword = await bcrypt.hash(password, 12); // Encrypt password
  const user = new User({ name, email, password: hashedPassword, role }); // Create user
  await user.save(); // Save to database
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET); // Create login token
  res.json({ token, user }); // Send back to frontend
});
```

#### **doctor.routes.js** - Doctor Information
**Purpose**: Handles doctor-related requests
**Endpoints**:
- `GET /api/doctors` - Get all verified doctors
- `GET /api/doctors/:id` - Get specific doctor
- `GET /api/doctors/specialties` - Get list of medical specialties
- `PUT /api/doctors/profile` - Update doctor profile

#### **appointment.routes.js** - Appointment Management
**Purpose**: Handles appointment booking and management
**Endpoints**:
- `GET /api/appointments/available-slots/:doctorId` - Get available time slots
- `POST /api/appointments/book` - Book new appointment
- `GET /api/appointments/my-appointments` - Get user's appointments
- `PATCH /api/appointments/:id/cancel` - Cancel appointment

#### **chat.routes.js** - Chat Messages
**Purpose**: Handles chat message storage and retrieval
**Endpoints**:
- `GET /api/chat/conversations` - Get all user's conversations
- `GET /api/chat/messages/:userId` - Get messages with specific user
- `POST /api/chat/send` - Send new message

#### **call.routes.js** - Call Management
**Purpose**: Handles call history and statistics
**Endpoints**:
- `GET /api/calls/history` - Get user's call history
- `POST /api/calls/rate` - Rate call quality
- `GET /api/calls/stats/summary` - Get call statistics

#### **helpline.routes.js** - Support System
**Purpose**: Handles support tickets and helpline
**Endpoints**:
- `POST /api/helpline/tickets` - Create support ticket
- `GET /api/helpline/tickets` - Get user's tickets
- `POST /api/helpline/tickets/:id/messages` - Add message to ticket

### **4. server/middleware/** (Security & Validation)

#### **auth.middleware.js** - Authentication Security
**Purpose**: Protects API routes from unauthorized access
**Functions**:
```javascript
// Check if user is logged in
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', ''); // Get login token
  if (!token) return res.status(401).json({ message: 'Access denied' }); // No token = not logged in
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token is valid
  req.user = decoded; // Add user info to request
  next(); // Continue to next function
};

// Check if user has correct role (patient/doctor)
const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) { // Check user's role
    return res.status(403).json({ message: 'Access denied' }); // Wrong role = access denied
  }
  next(); // Correct role = continue
};
```

### **5. server/socket/socketServer.js** - Real-time Communication
**Purpose**: Handles real-time chat, calls, and notifications
**Key Functions**:

```javascript
// When user connects to website
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userName}`); // Log connection
  activeUsers.set(socket.userId, { socketId: socket.id, status: 'online' }); // Mark user as online
  
  // When user sends chat message
  socket.on('send_message', async (data) => {
    const { receiverId, message } = data; // Get message details
    const newMessage = new Message({ sender: socket.userId, receiver: receiverId, message }); // Create message
    await newMessage.save(); // Save to database
    io.to(receiverId).emit('new_message', newMessage); // Send to receiver instantly
  });
  
  // When user starts video/audio call
  socket.on('initiate_call', async (data) => {
    const { receiverId, callType } = data; // Get call details
    const callId = uuidv4(); // Create unique call ID
    const newCall = new Call({ caller: socket.userId, receiver: receiverId, callType, callId }); // Create call record
    await newCall.save(); // Save to database
    io.to(receiverId).emit('incoming_call', { callId, caller: socket.userName, callType }); // Notify receiver
  });
});
```

## 🎨 **Frontend Files Explained**

### **1. client/src/App.js** - Main Application
**Purpose**: Main component that sets up the entire frontend
**What it does**:
- Sets up routing (which page to show for which URL)
- Wraps app with authentication and socket contexts
- Includes navigation and notification components

```javascript
function App() {
  return (
    <AuthProvider>           {/* Provides user login state to all components */}
      <SocketProvider>       {/* Provides real-time communication to all components */}
        <Router>             {/* Handles page navigation */}
          <Navbar />         {/* Top navigation bar */}
          <NotificationCenter /> {/* Shows incoming calls and messages */}
          <Routes>           {/* Defines which component shows for which URL */}
            <Route path="/" element={<HomePage />} />                    {/* Homepage */}
            <Route path="/login" element={<LoginPage />} />              {/* Login page */}
            <Route path="/doctor/:id" element={<DoctorProfilePage />} /> {/* Doctor details */}
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
```

### **2. client/src/context/** - Global State Management

#### **AuthContext.jsx** - User Authentication State
**Purpose**: Manages user login/logout state across entire app
**What it provides**:
- Current user information
- Login/logout functions
- Authentication status

```javascript
const AuthContext = createContext(); // Create context for sharing user data

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);           // Current logged-in user
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Is user logged in?
  const [token, setToken] = useState(localStorage.getItem('token')); // Login token
  
  const login = async (email, password) => {
    const response = await authAPI.login({ email, password }); // Call backend login
    setUser(response.data.user);        // Save user info
    setToken(response.data.token);      // Save login token
    setIsAuthenticated(true);           // Mark as logged in
    localStorage.setItem('token', response.data.token); // Remember login
  };
  
  const logout = () => {
    setUser(null);                      // Clear user info
    setToken(null);                     // Clear token
    setIsAuthenticated(false);          // Mark as logged out
    localStorage.removeItem('token');   // Forget login
  };
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children} {/* All child components can access user state */}
    </AuthContext.Provider>
  );
};
```

#### **SocketContext.jsx** - Real-time Communication State
**Purpose**: Manages Socket.io connection and real-time features
**What it provides**:
- Socket.io connection
- Real-time messaging functions
- Call management functions
- Notification handling

```javascript
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);           // Socket.io connection
  const [isConnected, setIsConnected] = useState(false); // Connection status
  const [notifications, setNotifications] = useState([]); // Incoming notifications
  const [incomingCall, setIncomingCall] = useState(null); // Incoming call info
  
  // Connect to Socket.io server when user logs in
  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io('http://localhost:5000', { auth: { token } }); // Connect to server
      
      newSocket.on('connect', () => setIsConnected(true));     // Mark as connected
      newSocket.on('disconnect', () => setIsConnected(false)); // Mark as disconnected
      
      // Listen for incoming messages
      newSocket.on('new_message', (message) => {
        addNotification({ type: 'message', title: 'New Message', message: message.content });
      });
      
      // Listen for incoming calls
      newSocket.on('incoming_call', (callData) => {
        setIncomingCall(callData); // Show incoming call popup
      });
      
      setSocket(newSocket); // Save socket connection
    }
  }, [isAuthenticated, token]);
  
  // Function to send message
  const sendMessage = (receiverId, message) => {
    if (socket) {
      socket.emit('send_message', { receiverId, message }); // Send to server
    }
  };
  
  // Function to start call
  const initiateCall = (receiverId, callType) => {
    if (socket) {
      socket.emit('initiate_call', { receiverId, callType }); // Send to server
    }
  };
};
```

### **3. client/src/services/api.js** - Backend Communication
**Purpose**: Functions to communicate with backend API
**What it contains**: All API call functions

```javascript
const API_BASE_URL = 'http://localhost:5000/api'; // Backend server address

// Create axios instance with default settings
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add authentication token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Get saved login token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Add to request header
  }
  return config;
});

// Authentication API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),        // Login user
  register: (userData) => api.post('/auth/register', userData),        // Register user
  getCurrentUser: () => api.get('/auth/me')                           // Get current user
};

// Doctor API calls
export const doctorAPI = {
  getAllDoctors: (params) => api.get('/doctors', { params }),         // Get all doctors
  getDoctorById: (id) => api.get(`/doctors/${id}`),                  // Get specific doctor
  getSpecialties: () => api.get('/doctors/specialties')              // Get medical specialties
};

// Appointment API calls
export const appointmentAPI = {
  getAvailableSlots: (doctorId, date) => api.get(`/appointments/available-slots/${doctorId}`, { params: { date } }),
  bookAppointment: (appointmentData) => api.post('/appointments/book', appointmentData),
  getMyAppointments: (params) => api.get('/appointments/my-appointments', { params }),
  cancelAppointment: (id, reason) => api.patch(`/appointments/${id}/cancel`, { cancellationReason: reason })
};
```

### **4. client/src/components/** - Reusable UI Components

#### **Navbar.jsx** - Top Navigation Bar
**Purpose**: Shows navigation links, user info, and communication buttons
**Key Features**:
- Logo and navigation links
- Login/logout buttons
- Messages and help icons
- User welcome message

```javascript
const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth(); // Get user state
  const { isConnected, notifications } = useSocket();  // Get connection state
  
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary-600">
            DocBook
          </Link>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                
                {/* Messages Button */}
                <button onClick={() => setShowCommunications(true)}>
                  <FiMessageCircle size={20} />
                  {notifications.length > 0 && (
                    <span className="notification-badge">{notifications.length}</span>
                  )}
                </button>
                
                {/* User Info */}
                <span>Welcome, {user?.name}</span>
                <button onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
```

#### **DoctorCard.jsx** - Doctor Information Display
**Purpose**: Shows doctor information in a card format
**Used in**: Homepage, search results

```javascript
const DoctorCard = ({ doctor }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Doctor Photo */}
      <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl font-semibold text-primary-600">
          {doctor.name.charAt(0)} {/* First letter of name */}
        </span>
      </div>
      
      {/* Doctor Info */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{doctor.name}</h3>
      <p className="text-gray-600 mb-2">{doctor.specialty}</p>
      <p className="text-sm text-gray-500 mb-2">{doctor.experienceInYears} years experience</p>
      <p className="text-lg font-bold text-primary-600 mb-4">${doctor.consultationFee}</p>
      
      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Link to={`/doctor/${doctor._id}`} className="btn-primary flex-1">
          View Profile
        </Link>
        <button onClick={() => handleStartChat(doctor._id)} className="btn-secondary">
          <FiMessageCircle size={16} />
        </button>
      </div>
    </div>
  );
};
```

#### **ChatInterface.jsx** - Real-time Chat Component
**Purpose**: Provides chat interface between users
**Key Features**:
- Message display
- Real-time messaging
- Typing indicators
- Call buttons

```javascript
const ChatInterface = ({ receiverId, receiverName }) => {
  const [messages, setMessages] = useState([]);     // Chat messages
  const [newMessage, setNewMessage] = useState(''); // Current message being typed
  const { sendMessage, socket } = useSocket();      // Socket functions
  
  // Listen for new messages
  useEffect(() => {
    if (socket) {
      socket.on('new_message', (message) => {
        setMessages(prev => [...prev, message]); // Add new message to list
      });
    }
  }, [socket]);
  
  // Send message function
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(receiverId, newMessage); // Send via Socket.io
      setNewMessage(''); // Clear input
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold">{receiverName}</h3>
        <div className="flex space-x-2">
          <button onClick={() => initiateCall(receiverId, 'audio')}>
            <FiPhone size={20} />
          </button>
          <button onClick={() => initiateCall(receiverId, 'video')}>
            <FiVideo size={20} />
          </button>
        </div>
      </div>
      
      {/* Messages Display */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message._id} className={`mb-4 ${message.sender._id === user._id ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-3 rounded-lg ${message.sender._id === user._id ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>
              {message.message}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(message.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
      
      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full"
          />
          <button type="submit" className="btn-primary">
            <FiSend size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};
```

#### **VideoCall.jsx** - Video Call Interface
**Purpose**: Provides video calling interface with WebRTC
**Key Features**:
- Video streams display
- Call controls (mute, camera, end call)
- WebRTC peer-to-peer connection

```javascript
const VideoCall = ({ callData, onEndCall }) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const { localVideoRef, remoteVideoRef, startCall, endCall, toggleVideo, toggleAudio } = useWebRTC(callData.roomId);

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Remote Video (Main Screen) */}
      <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

      {/* Local Video (Small Corner) */}
      <video ref={localVideoRef} autoPlay playsInline muted className="absolute top-4 right-4 w-32 h-24 rounded-lg" />

      {/* Call Controls */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <button onClick={toggleAudio} className={`p-4 rounded-full ${isAudioEnabled ? 'bg-gray-700' : 'bg-red-600'}`}>
          {isAudioEnabled ? <FiMic size={24} /> : <FiMicOff size={24} />}
        </button>
        <button onClick={toggleVideo} className={`p-4 rounded-full ${isVideoEnabled ? 'bg-gray-700' : 'bg-red-600'}`}>
          {isVideoEnabled ? <FiVideo size={24} /> : <FiVideoOff size={24} />}
        </button>
        <button onClick={onEndCall} className="p-4 rounded-full bg-red-600">
          <FiPhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};
```

#### **BookingForm.jsx** - Appointment Booking
**Purpose**: Form for booking appointments with doctors
**Key Features**:
- Date and time selection
- Available slots display
- Form validation

```javascript
const BookingForm = ({ doctorId, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [reason, setReason] = useState('');

  // Get available time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      appointmentAPI.getAvailableSlots(doctorId, selectedDate)
        .then(response => setAvailableSlots(response.data.data.slots));
    }
  }, [selectedDate, doctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await appointmentAPI.bookAppointment({
        doctorId,
        date: selectedDate,
        timeSlot: selectedTime,
        reason
      });
      onSuccess(); // Show success message
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date Selection */}
      <div>
        <label className="block text-sm font-medium mb-1">Select Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]} // Today or later
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>

      {/* Time Slot Selection */}
      {availableSlots.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Select Time</label>
          <div className="grid grid-cols-3 gap-2">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedTime(slot)}
                className={`p-2 text-sm rounded border ${selectedTime === slot ? 'bg-primary-600 text-white' : 'bg-white'}`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reason for Visit */}
      <div>
        <label className="block text-sm font-medium mb-1">Reason for Visit</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe your symptoms or reason for consultation"
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
        />
      </div>

      <button type="submit" className="w-full btn-primary">
        Book Appointment
      </button>
    </form>
  );
};
```

### **5. client/src/pages/** - Full Page Components

#### **HomePage.jsx** - Main Landing Page
**Purpose**: Shows all doctors and search functionality
**Key Features**:
- Doctor grid display
- Search and filter
- Specialty dropdown

```javascript
const HomePage = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Load doctors and specialties when page loads
  useEffect(() => {
    const fetchData = async () => {
      const [doctorsRes, specialtiesRes] = await Promise.all([
        doctorAPI.getAllDoctors(),
        doctorAPI.getSpecialties()
      ]);
      setDoctors(doctorsRes.data.data.doctors);
      setSpecialties(specialtiesRes.data.data.specialties);
    };
    fetchData();
  }, []);

  // Filter doctors based on search and specialty
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Find & Book Appointments with Top Doctors
        </h1>
        <p className="text-xl text-gray-600">
          Connect with verified healthcare professionals for quality medical care
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search doctors by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Specialties</option>
          {specialties.map(specialty => (
            <option key={specialty} value={specialty}>{specialty}</option>
          ))}
        </select>
      </div>

      {/* Doctors Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map(doctor => (
          <DoctorCard key={doctor._id} doctor={doctor} />
        ))}
      </div>
    </div>
  );
};
```

#### **LoginPage.jsx** - User Login
**Purpose**: Handles user authentication
**Key Features**:
- Login form
- Role-based redirect
- Error handling

```javascript
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password); // Call login function from AuthContext
      // Redirect based on user role
      const user = JSON.parse(localStorage.getItem('user'));
      if (user.role === 'doctor') {
        navigate('/doctor-dashboard');
      } else {
        navigate('/patient-dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Login to DocBook</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          Don't have an account? <Link to="/register" className="text-primary-600 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};
```

### **6. client/src/hooks/** - Custom React Functionality

#### **useWebRTC.js** - Video Call Logic
**Purpose**: Handles WebRTC peer-to-peer video calling
**Key Features**:
- Camera and microphone access
- Peer connection management
- Call controls

```javascript
const useWebRTC = (roomId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // Get user's camera and microphone
  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream; // Show local video
      }
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  // Create peer connection for WebRTC
  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // STUN server for NAT traversal
    });

    // When remote stream is received
    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]; // Show remote video
      }
    };

    return peerConnection;
  };

  // Start video call
  const startCall = async () => {
    const stream = await getUserMedia();
    const peerConnection = createPeerConnection();

    // Add local stream to peer connection
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    peerConnectionRef.current = peerConnection;
  };

  // Toggle video on/off
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  // Toggle audio on/off
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  // End call and cleanup
  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop()); // Stop camera/microphone
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close(); // Close peer connection
    }
    setLocalStream(null);
    setRemoteStream(null);
  };

  return {
    localVideoRef,
    remoteVideoRef,
    isVideoEnabled,
    isAudioEnabled,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio
  };
};
```

## 🔄 **How Everything Connects Together**

### **Data Flow Example: Sending a Chat Message**

1. **User types message** in `ChatInterface.jsx`
2. **Frontend calls** `sendMessage()` from `SocketContext.jsx`
3. **Socket.io client** sends message to server via `socket.emit('send_message')`
4. **Backend receives** message in `socketServer.js`
5. **Server saves** message to database using `Message` model
6. **Server sends** message to receiver via `socket.to(receiverId).emit('new_message')`
7. **Receiver's frontend** gets message via `socket.on('new_message')`
8. **Message appears** instantly in receiver's chat interface

### **Data Flow Example: Booking an Appointment**

1. **User fills form** in `BookingForm.jsx`
2. **Frontend calls** `appointmentAPI.bookAppointment()` from `api.js`
3. **API makes HTTP request** to `/api/appointments/book`
4. **Backend receives** request in `appointment.routes.js`
5. **Server validates** user authentication via `auth.middleware.js`
6. **Server creates** appointment using `Appointment` model
7. **Server saves** to MongoDB database
8. **Server sends** success response back to frontend
9. **Frontend shows** success message to user

## 🎯 **Key Technologies Explained**

### **Backend Technologies**
- **Express.js**: Web server framework (handles HTTP requests)
- **MongoDB**: Database (stores all data)
- **Mongoose**: Database connection tool (makes MongoDB easier to use)
- **Socket.io**: Real-time communication (instant messages and calls)
- **JWT**: Authentication tokens (secure login)
- **bcryptjs**: Password encryption (keeps passwords safe)

### **Frontend Technologies**
- **React**: User interface framework (creates interactive web pages)
- **Socket.io Client**: Real-time communication (connects to backend Socket.io)
- **Axios**: HTTP requests (talks to backend API)
- **React Router**: Page navigation (handles different URLs)
- **Tailwind CSS**: Styling framework (makes everything look good)
- **WebRTC**: Video calling (peer-to-peer video/audio)

## 📊 **Project Summary**

Your Doctor Appointment Booking System is a **complete telemedicine platform** that includes:

### **Core Features**
- User registration and authentication
- Doctor profiles with specialties and availability
- Appointment booking and management
- Patient and doctor dashboards

### **Communication Features**
- Real-time chat between patients and doctors
- Audio and video calling with WebRTC
- Helpline support with ticket system
- Emergency call functionality
- Real-time notifications

### **Technical Architecture**
- **Backend**: Node.js + Express + MongoDB + Socket.io
- **Frontend**: React + Tailwind CSS + Socket.io Client
- **Database**: MongoDB with 6 collections (Users, Doctors, Appointments, Messages, Calls, Tickets)
- **Real-time**: Socket.io for instant communication
- **Security**: JWT authentication and password encryption

This creates a **professional healthcare platform** ready for real-world use! 🏥✨
