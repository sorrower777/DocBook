# 🔄 Complete Code Workflow Analysis - Client & Server

## 📋 **Table of Contents**
1. [Application Architecture Overview](#architecture)
2. [Server-Side Workflow](#server-workflow)
3. [Client-Side Workflow](#client-workflow)
4. [Data Flow Between Components](#data-flow)
5. [Real-time Communication Flow](#realtime-flow)
6. [Authentication & Security Flow](#auth-flow)
7. [File-by-File Code Explanation](#file-explanation)

---

## 🏗️ **Application Architecture Overview** {#architecture}

### **High-Level Architecture**
```
┌─────────────────┐    HTTP/Socket.io    ┌─────────────────┐    MongoDB    ┌─────────────────┐
│   React Client  │ ←──────────────────→ │  Express Server │ ←──────────→ │    Database     │
│   (Port 3000)   │                      │   (Port 5000)   │              │   Collections   │
└─────────────────┘                      └─────────────────┘              └─────────────────┘
```

### **Technology Stack**
- **Frontend**: React 18 + Tailwind CSS + Socket.io Client + WebRTC
- **Backend**: Node.js + Express.js + Socket.io Server + JWT
- **Database**: MongoDB + Mongoose ODM
- **Real-time**: Socket.io for instant messaging and notifications
- **Video/Audio**: WebRTC for peer-to-peer communication

### **Core Features**
1. **User Management**: Registration, Login, Profile Management
2. **Doctor Discovery**: Browse doctors by specialty, location, ratings
3. **Appointment Booking**: Schedule, manage, and track appointments
4. **Real-time Chat**: Instant messaging between patients and doctors
5. **Video/Audio Calls**: WebRTC-based calling system
6. **Helpline Support**: Ticket-based support system with live chat
7. **Notifications**: Real-time notifications for all activities

---

## 🖥️ **Server-Side Workflow** {#server-workflow}

### **1. Server Entry Point: `server/server.js`**

**Purpose**: Main server file that initializes everything

**Key Code Sections**:
```javascript
// 1. Import Dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');

// 2. Load Environment Variables
dotenv.config();

// 3. Create Express App & HTTP Server
const app = express();
const server = http.createServer(app);

// 4. Database Connection
mongoose.connect(process.env.MONGO_URI)

// 5. Middleware Setup
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// 6. API Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/helpline', helplineRoutes);

// 7. Socket.io Initialization
initializeSocket(server);

// 8. Start Server
server.listen(PORT)
```

**Workflow**:
1. **Environment Setup**: Loads `.env` variables for database, JWT secrets
2. **Database Connection**: Connects to MongoDB using Mongoose
3. **Middleware Configuration**: Sets up CORS, JSON parsing, authentication
4. **Route Registration**: Maps API endpoints to route handlers
5. **Socket.io Setup**: Initializes real-time communication server
6. **Server Start**: Listens on specified port (5000)

### **2. Database Models: `server/models/`**

**Purpose**: Define data structure and validation rules

**File Structure**:
```
models/
├── user.model.js           # User authentication & basic info
├── doctorProfile.model.js  # Doctor-specific data & availability
├── appointment.model.js    # Appointment booking & management
├── chat.model.js          # Chat messages & conversations
├── call.model.js          # Call records & history
├── helplineTicket.model.js # Support tickets & messages
└── index.js               # Export all models
```

**Key Model Relationships**:
```javascript
// User Model (Base for all users)
const userSchema = {
  name: String,
  email: String,
  password: String (hashed),
  role: ['patient', 'doctor', 'admin'],
  isVerified: Boolean
}

// Doctor Profile (Extends User)
const doctorProfileSchema = {
  userId: ObjectId (ref: 'User'),
  specialization: String,
  experience: Number,
  availability: [TimeSlots],
  rating: Number,
  consultationFee: Number
}

// Appointment (Links Patient + Doctor)
const appointmentSchema = {
  patientId: ObjectId (ref: 'User'),
  doctorId: ObjectId (ref: 'User'),
  appointmentDate: Date,
  timeSlot: String,
  status: ['pending', 'confirmed', 'completed', 'cancelled'],
  symptoms: String,
  prescription: String
}
```

### **3. API Routes: `server/routes/`**

**Purpose**: Handle HTTP requests and business logic

**Route Structure**:
```
routes/
├── auth.routes.js        # POST /api/auth/register, /login, /me
├── doctor.routes.js      # GET /api/doctors, /doctors/:id, /specialties
├── appointment.routes.js # POST /api/appointments, GET /my-appointments
├── chat.routes.js        # GET /api/chat/conversations, /messages
├── call.routes.js        # POST /api/calls/initiate, GET /history
└── helpline.routes.js    # POST /api/helpline/tickets, GET /categories
```

**Example Route Workflow** (`auth.routes.js`):
```javascript
// POST /api/auth/login
router.post('/login', async (req, res) => {
  // 1. Extract email & password from request
  const { email, password } = req.body;
  
  // 2. Find user in database
  const user = await User.findOne({ email });
  
  // 3. Verify password using bcrypt
  const isMatch = await bcrypt.compare(password, user.password);
  
  // 4. Generate JWT token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  
  // 5. Send response with user data & token
  res.json({ success: true, data: { user, token } });
});
```

### **4. Authentication Middleware: `server/middleware/auth.middleware.js`**

**Purpose**: Protect routes and verify JWT tokens

**Code Flow**:
```javascript
const authMiddleware = (req, res, next) => {
  // 1. Extract token from Authorization header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  // 2. Verify token with JWT secret
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // 3. Find user and attach to request
  const user = await User.findById(decoded.userId);
  req.user = user;
  
  // 4. Continue to next middleware/route
  next();
};
```

### **5. Socket.io Server: `server/socket/socketServer.js`**

**Purpose**: Handle real-time communication (chat, calls, notifications)

**Key Socket Events**:
```javascript
io.on('connection', (socket) => {
  // User Authentication
  socket.on('authenticate', (token) => {
    // Verify JWT and associate socket with user
  });
  
  // Chat Events
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
  });
  
  socket.on('send_message', (data) => {
    // Save message to database
    // Emit to other participants
    io.to(chatId).emit('new_message', message);
  });
  
  // Call Events
  socket.on('initiate_call', (data) => {
    // Create call record
    // Notify recipient
    io.to(recipientSocketId).emit('incoming_call', callData);
  });
  
  // WebRTC Signaling
  socket.on('webrtc_offer', (data) => {
    socket.to(data.roomId).emit('webrtc_offer', data.offer);
  });
});
```

---

## 🌐 **Client-Side Workflow** {#client-workflow}

### **1. Application Entry Point: `client/src/index.js`**

**Purpose**: Bootstrap React application

**Code Flow**:
```javascript
// 1. Import React and main App component
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 2. Import global styles
import './index.css';

// 3. Create React root and render App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

### **2. Main App Component: `client/src/App.js`**

**Purpose**: Set up routing, context providers, and global layout

**Code Structure**:
```javascript
function App() {
  return (
    // 1. Authentication Context Provider
    <AuthProvider>
      {/* 2. Socket.io Context Provider */}
      <SocketProvider>
        {/* 3. React Router for navigation */}
        <Router>
          <div className="App">
            {/* 4. Global Navigation */}
            <Navbar />
            
            {/* 5. Notification System */}
            <NotificationCenter />
            
            {/* 6. Route Definitions */}
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes */}
              <Route path="/patient-dashboard" element={
                <ProtectedRoute requiredRole="patient">
                  <PatientDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
```

### **3. Context Providers: `client/src/context/`**

**Purpose**: Manage global application state

#### **AuthContext.jsx** - Authentication State Management

**Key Functions**:
```javascript
// State Management
const [state, dispatch] = useReducer(authReducer, initialState);

// Login Function
const login = async (credentials) => {
  // 1. Call API login endpoint
  const response = await authAPI.login(credentials);
  
  // 2. Store token and user data
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  
  // 3. Update global state
  dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
};

// Auto-load user on app start
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    loadUser(); // Verify token with server
  }
}, []);
```

#### **SocketContext.jsx** - Real-time Communication

**Key Functions**:
```javascript
// Socket Connection Setup
useEffect(() => {
  if (isAuthenticated && token && user) {
    // 1. Create socket connection
    const newSocket = io(process.env.REACT_APP_API_URL?.replace('/api', ''), {
      auth: { token }
    });
    
    // 2. Set up event listeners
    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('new_message', handleNewMessage);
    newSocket.on('incoming_call', handleIncomingCall);
    
    setSocket(newSocket);
  }
}, [isAuthenticated, token, user]);

// Message Sending Function
const sendMessage = (receiverId, message) => {
  if (socket) {
    socket.emit('send_message', { receiverId, message });
  }
};
```

### **4. API Services: `client/src/services/api.js`**

**Purpose**: Handle HTTP requests to backend

**Code Structure**:
```javascript
// 1. Create Axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// 2. Request interceptor - Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 4. API function groups
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me')
};

export const doctorAPI = {
  getAllDoctors: (params) => api.get('/doctors', { params }),
  getDoctorById: (id) => api.get(`/doctors/${id}`)
};
```

### **5. React Components: `client/src/components/`**

**Purpose**: Reusable UI components with specific functionality

#### **Component Structure**:
```
components/
├── Navbar.jsx              # Navigation with auth status
├── DoctorCard.jsx          # Doctor listing display
├── BookingForm.jsx         # Appointment booking
├── ChatInterface.jsx       # Real-time messaging
├── VideoCall.jsx           # WebRTC video calling
├── HelplineSupport.jsx     # Support ticket system
├── NotificationCenter.jsx  # Real-time notifications
├── ProtectedRoute.jsx      # Route authentication
└── LoadingSpinner.jsx      # Loading states
```

#### **Example Component Workflow** (`ChatInterface.jsx`):
```javascript
function ChatInterface({ recipientId }) {
  // 1. Get socket and messages from context
  const { socket, messages, sendMessage } = useSocket();
  const [newMessage, setNewMessage] = useState('');
  
  // 2. Join chat room on component mount
  useEffect(() => {
    if (socket && recipientId) {
      socket.emit('join_chat', recipientId);
    }
  }, [socket, recipientId]);
  
  // 3. Handle message sending
  const handleSendMessage = () => {
    sendMessage(recipientId, newMessage);
    setNewMessage('');
  };
  
  // 4. Render chat interface
  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(message => (
          <div key={message._id} className="message">
            {message.content}
          </div>
        ))}
      </div>
      <input 
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
      />
    </div>
  );
}
```

### **6. Page Components: `client/src/pages/`**

**Purpose**: Full page layouts combining multiple components

#### **Page Structure**:
```
pages/
├── HomePage.jsx           # Landing page with doctor listings
├── LoginPage.jsx          # User authentication
├── RegisterPage.jsx       # User registration
├── DoctorProfilePage.jsx  # Individual doctor details
├── PatientDashboard.jsx   # Patient's main interface
└── DoctorDashboard.jsx    # Doctor's main interface
```

#### **Example Page Workflow** (`PatientDashboard.jsx`):
```javascript
function PatientDashboard() {
  // 1. Get user data from auth context
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('appointments');
  
  // 2. Load user's appointments on mount
  useEffect(() => {
    const loadAppointments = async () => {
      const response = await appointmentAPI.getMyAppointments();
      setAppointments(response.data.appointments);
    };
    loadAppointments();
  }, []);
  
  // 3. Render dashboard with tabs
  return (
    <div className="dashboard">
      <h1>Welcome, {user.name}</h1>
      
      <div className="tabs">
        <button onClick={() => setActiveTab('appointments')}>
          My Appointments
        </button>
        <button onClick={() => setActiveTab('messages')}>
          Messages
        </button>
        <button onClick={() => setActiveTab('calls')}>
          Call History
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'appointments' && (
          <AppointmentList appointments={appointments} />
        )}
        {activeTab === 'messages' && (
          <ChatInterface />
        )}
        {activeTab === 'calls' && (
          <CallHistory />
        )}
      </div>
    </div>
  );
}
```

---

## 🔄 **Data Flow Between Components** {#data-flow}

### **1. User Registration Flow**
```
RegisterPage → authAPI.register() → POST /api/auth/register → User.create() → JWT Token → AuthContext → Dashboard
```

### **2. Doctor Browsing Flow**
```
HomePage → doctorAPI.getAllDoctors() → GET /api/doctors → DoctorProfile.find() → DoctorCard Components → UI Display
```

### **3. Appointment Booking Flow**
```
DoctorProfilePage → BookingForm → appointmentAPI.create() → POST /api/appointments → Appointment.create() → Email Notification
```

### **4. Real-time Chat Flow**
```
ChatInterface → sendMessage() → socket.emit('send_message') → socketServer → Chat.create() → socket.to().emit('new_message') → ChatInterface
```

### **5. Video Call Flow**
```
VideoCall → initiateCall() → socket.emit('initiate_call') → socketServer → socket.to().emit('incoming_call') → WebRTC Signaling → Peer Connection
```

---

## 🔐 **Authentication & Security Flow** {#auth-flow}

### **1. User Registration Process**

**Frontend Flow** (`RegisterPage.jsx`):
```javascript
const handleRegister = async (formData) => {
  // 1. Validate form data
  if (!formData.email || !formData.password) return;

  // 2. Call registration API
  const response = await authAPI.register(formData);

  // 3. Auto-login after successful registration
  if (response.data.success) {
    login({ email: formData.email, password: formData.password });
  }
};
```

**Backend Flow** (`auth.routes.js`):
```javascript
router.post('/register', async (req, res) => {
  // 1. Extract user data
  const { name, email, password, role } = req.body;

  // 2. Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ error: 'User exists' });

  // 3. Hash password with bcrypt
  const hashedPassword = await bcrypt.hash(password, 12);

  // 4. Create user in database
  const user = await User.create({
    name, email, password: hashedPassword, role
  });

  // 5. Generate JWT token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

  // 6. Send response
  res.status(201).json({ success: true, data: { user, token } });
});
```

### **2. Login Authentication Process**

**Frontend Flow** (`LoginPage.jsx`):
```javascript
const handleLogin = async (credentials) => {
  // 1. Call login function from AuthContext
  await login(credentials);

  // 2. Redirect based on user role
  if (user.role === 'patient') {
    navigate('/patient-dashboard');
  } else if (user.role === 'doctor') {
    navigate('/doctor-dashboard');
  }
};
```

**AuthContext Login Function**:
```javascript
const login = async (credentials) => {
  // 1. Set loading state
  dispatch({ type: 'LOGIN_START' });

  // 2. Call API
  const response = await authAPI.login(credentials);

  // 3. Store token and user data
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));

  // 4. Update global state
  dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
};
```

### **3. Protected Route System**

**ProtectedRoute Component**:
```javascript
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  // 1. Show loading while checking auth
  if (isLoading) return <LoadingSpinner />;

  // 2. Redirect to login if not authenticated
  if (!isAuthenticated) return <Navigate to="/login" />;

  // 3. Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  // 4. Render protected content
  return children;
}
```

### **4. JWT Token Management**

**API Request Interceptor**:
```javascript
api.interceptors.request.use((config) => {
  // 1. Get token from localStorage
  const token = localStorage.getItem('token');

  // 2. Add to Authorization header
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

**Backend Token Verification**:
```javascript
const authMiddleware = async (req, res, next) => {
  // 1. Extract token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // 2. Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3. Find user and attach to request
  const user = await User.findById(decoded.userId).select('-password');
  req.user = user;

  next();
};
```

---

## 📡 **Real-time Communication Flow** {#realtime-flow}

### **1. Socket.io Connection Establishment**

**Client-Side Connection** (`SocketContext.jsx`):
```javascript
useEffect(() => {
  if (isAuthenticated && token && user) {
    // 1. Create socket connection with auth
    const newSocket = io(serverURL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5
    });

    // 2. Handle connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    // 3. Set up message listeners
    newSocket.on('new_message', handleNewMessage);
    newSocket.on('incoming_call', handleIncomingCall);
    newSocket.on('user_online', handleUserOnline);

    setSocket(newSocket);
  }
}, [isAuthenticated, token, user]);
```

**Server-Side Connection** (`socketServer.js`):
```javascript
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      socket.userId = user._id;
      socket.userRole = user.role;

      // 2. Join user to their personal room
      socket.join(user._id.toString());

      // 3. Update online status
      socket.broadcast.emit('user_online', {
        userId: user._id,
        name: user.name
      });

    } catch (error) {
      socket.emit('auth_error', 'Invalid token');
      socket.disconnect();
    }
  });
});
```

### **2. Real-time Chat System**

**Message Sending Flow**:

**Frontend** (`ChatInterface.jsx`):
```javascript
const sendMessage = (receiverId, content) => {
  // 1. Emit message through socket
  socket.emit('send_message', {
    receiverId,
    content,
    timestamp: new Date()
  });

  // 2. Optimistically update UI
  setMessages(prev => [...prev, {
    senderId: user._id,
    receiverId,
    content,
    timestamp: new Date(),
    status: 'sending'
  }]);
};
```

**Backend** (`socketServer.js`):
```javascript
socket.on('send_message', async (data) => {
  // 1. Save message to database
  const message = await Chat.create({
    senderId: socket.userId,
    receiverId: data.receiverId,
    content: data.content,
    timestamp: new Date()
  });

  // 2. Send to recipient if online
  io.to(data.receiverId).emit('new_message', {
    _id: message._id,
    senderId: socket.userId,
    senderName: socket.userName,
    content: data.content,
    timestamp: message.timestamp
  });

  // 3. Confirm delivery to sender
  socket.emit('message_sent', {
    tempId: data.tempId,
    messageId: message._id
  });
});
```

### **3. Video Call System with WebRTC**

**Call Initiation Flow**:

**Frontend** (`VideoCall.jsx`):
```javascript
const initiateCall = async (receiverId, callType) => {
  // 1. Create WebRTC peer connection
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  // 2. Get user media (camera/microphone)
  const localStream = await navigator.mediaDevices.getUserMedia({
    video: callType === 'video',
    audio: true
  });

  // 3. Add local stream to peer connection
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // 4. Create offer and send through socket
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit('initiate_call', {
    receiverId,
    callType,
    offer
  });
};
```

**Backend Call Signaling** (`socketServer.js`):
```javascript
socket.on('initiate_call', async (data) => {
  // 1. Create call record in database
  const call = await Call.create({
    callerId: socket.userId,
    receiverId: data.receiverId,
    callType: data.callType,
    status: 'ringing',
    startTime: new Date()
  });

  // 2. Notify recipient
  io.to(data.receiverId).emit('incoming_call', {
    callId: call._id,
    callerId: socket.userId,
    callerName: socket.userName,
    callType: data.callType,
    offer: data.offer
  });
});

// WebRTC signaling events
socket.on('webrtc_answer', (data) => {
  socket.to(data.callerId).emit('webrtc_answer', data.answer);
});

socket.on('webrtc_ice_candidate', (data) => {
  socket.to(data.targetId).emit('webrtc_ice_candidate', data.candidate);
});
```

### **4. Notification System**

**Notification Creation** (`SocketContext.jsx`):
```javascript
const addNotification = (notification) => {
  const id = Date.now().toString();
  const newNotification = { ...notification, id };

  // 1. Add to notifications array
  setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);

  // 2. Auto-remove after 5 seconds
  setTimeout(() => {
    removeNotification(id);
  }, 5000);

  // 3. Show browser notification if permission granted
  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico'
    });
  }
};
```

**Server-Side Notification Broadcasting**:
```javascript
// New appointment notification
socket.on('appointment_booked', async (data) => {
  // 1. Save appointment to database
  const appointment = await Appointment.create(data);

  // 2. Notify doctor
  io.to(data.doctorId).emit('new_notification', {
    type: 'appointment',
    title: 'New Appointment',
    message: `You have a new appointment with ${data.patientName}`,
    data: appointment
  });
});
```

---

## 📁 **File-by-File Code Explanation** {#file-explanation}

### **Server Files Detailed Analysis**

#### **1. `server/server.js` - Main Server Entry Point**

**Line-by-Line Breakdown**:
```javascript
// Lines 1-6: Import required modules
const express = require('express');        // Web framework
const mongoose = require('mongoose');      // MongoDB ODM
const cors = require('cors');             // Cross-origin requests
const dotenv = require('dotenv');         // Environment variables
const http = require('http');             // HTTP server

// Lines 7-8: Load environment variables
dotenv.config();

// Lines 10-16: Import route modules
const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctor.routes');
// ... other route imports

// Lines 18-19: Import socket server
const initializeSocket = require('./socket/socketServer');

// Lines 21-23: Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Lines 25-35: CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://doc-book-app.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Lines 37-38: Middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Lines 40-50: Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Lines 52-60: Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Lines 72-78: API route registration
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/helpline', helplineRoutes);

// Lines 80-86: 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Lines 88-89: Initialize Socket.io
initializeSocket(server);

// Lines 91-95: Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

**Purpose of Each Section**:
- **Imports**: Load all necessary modules and dependencies
- **Environment**: Configure environment variables for different deployments
- **CORS**: Allow frontend applications to make requests from different domains
- **Middleware**: Parse JSON requests and handle URL encoding
- **Database**: Connect to MongoDB using connection string from environment
- **Routes**: Map API endpoints to their respective handler functions
- **Socket.io**: Initialize real-time communication server
- **Server Start**: Begin listening for HTTP requests on specified port

#### **2. `server/models/user.model.js` - User Data Schema**

**Complete Code Analysis**:
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema definition
const userSchema = new mongoose.Schema({
  // Basic user information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false  // Don't include password in queries by default
  },

  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },

  // Profile information
  phone: {
    type: String,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },

  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },

  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },

  // Account status
  isVerified: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // Timestamps
  lastLogin: Date,

}, {
  timestamps: true  // Automatically add createdAt and updatedAt
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified
  if (!this.isModified('password')) return next();

  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate user profile
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;  // Remove password from JSON output
  return user;
};

module.exports = mongoose.model('User', userSchema);
```

**Key Features**:
- **Validation**: Built-in validation for email format, password length, etc.
- **Security**: Automatic password hashing using bcrypt
- **Flexibility**: Support for different user roles (patient, doctor, admin)
- **Data Integrity**: Unique email constraint and required fields
- **Privacy**: Password excluded from JSON responses

This analysis covers the core architecture and workflow. Would you like me to continue with more specific files or focus on particular aspects of the codebase?
