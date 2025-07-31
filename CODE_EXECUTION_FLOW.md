# ⚡ Complete Code Execution Flow - Step by Step

## 🚀 **Application Startup Sequence**

### **1. Backend Server Startup (`server/server.js`)**

**Step-by-Step Execution**:
```javascript
// 1. Module Loading Phase
const express = require('express');        // Load Express framework
const mongoose = require('mongoose');      // Load MongoDB ODM
const cors = require('cors');             // Load CORS middleware
const dotenv = require('dotenv');         // Load environment variables
const http = require('http');             // Load HTTP server

// 2. Environment Configuration
dotenv.config();                          // Read .env file
console.log('Environment loaded');

// 3. Route Module Imports
const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctor.routes');
// ... other routes loaded

// 4. Express App Creation
const app = express();                    // Create Express application
const server = http.createServer(app);    // Create HTTP server

// 5. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// 6. Middleware Setup
app.use(cors({ origin: allowedOrigins })); // Enable CORS
app.use(express.json());                   // Parse JSON requests

// 7. Route Registration
app.use('/api/auth', authRoutes);         // Register auth endpoints
app.use('/api/doctors', doctorRoutes);    // Register doctor endpoints
// ... other routes registered

// 8. Socket.io Initialization
const initializeSocket = require('./socket/socketServer');
initializeSocket(server);                 // Start real-time server

// 9. Server Start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### **2. Frontend Application Startup (`client/src/index.js`)**

**Step-by-Step Execution**:
```javascript
// 1. React Imports
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';                     // Load global styles

// 2. DOM Root Creation
const root = ReactDOM.createRoot(
  document.getElementById('root')         // Find root element in HTML
);

// 3. App Rendering
root.render(<App />);                    // Render main App component
```

### **3. React App Initialization (`client/src/App.js`)**

**Step-by-Step Execution**:
```javascript
function App() {
  return (
    // 1. Authentication Context Setup
    <AuthProvider>                        // Initialize auth state
      {/* 2. Socket Context Setup */}
      <SocketProvider>                    // Initialize socket connection
        {/* 3. Router Setup */}
        <Router>                          // Enable navigation
          <div className="App">
            {/* 4. Global Components */}
            <Navbar />                    // Always visible navigation
            <NotificationCenter />        // Real-time notifications
            
            {/* 5. Route Definitions */}
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              // ... other routes
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
```

## 🔐 **User Authentication Flow**

### **Registration Process**

**Frontend Execution** (`RegisterPage.jsx`):
```javascript
const handleRegister = async (formData) => {
  // 1. Form Validation
  if (!formData.email || !formData.password) {
    setError('All fields required');
    return;
  }
  
  // 2. API Call
  try {
    setLoading(true);
    const response = await authAPI.register(formData);
    
    // 3. Success Handling
    if (response.data.success) {
      // Auto-login after registration
      await login({
        email: formData.email,
        password: formData.password
      });
      navigate('/patient-dashboard');
    }
  } catch (error) {
    setError(error.response?.data?.message || 'Registration failed');
  } finally {
    setLoading(false);
  }
};
```

**API Service Execution** (`services/api.js`):
```javascript
// authAPI.register() execution
export const authAPI = {
  register: (userData) => {
    // 1. Axios request with interceptors
    return api.post('/auth/register', userData);
    // 2. Request interceptor adds headers
    // 3. HTTP POST to backend
    // 4. Response interceptor handles errors
  }
};
```

**Backend Route Execution** (`routes/auth.routes.js`):
```javascript
router.post('/register', async (req, res) => {
  try {
    // 1. Extract data from request body
    const { name, email, password, role } = req.body;
    
    // 2. Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // 3. Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // 4. Create user (triggers password hashing)
    const user = await User.create({
      name, email, password, role
    });
    
    // 5. Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // 6. Send response
    res.status(201).json({
      success: true,
      data: { user, token }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

**Database Model Execution** (`models/user.model.js`):
```javascript
// User.create() triggers pre-save middleware
userSchema.pre('save', async function(next) {
  // 1. Check if password is modified
  if (!this.isModified('password')) return next();
  
  // 2. Hash password
  this.password = await bcrypt.hash(this.password, 12);
  
  // 3. Continue with save
  next();
});

// 4. Save to MongoDB
// 5. Return created user document
```

## 💬 **Real-time Chat Flow**

### **Message Sending Process**

**Frontend Component** (`ChatInterface.jsx`):
```javascript
const sendMessage = (content) => {
  // 1. Optimistic UI update
  const tempMessage = {
    id: Date.now(),
    senderId: user._id,
    content,
    timestamp: new Date(),
    status: 'sending'
  };
  setMessages(prev => [...prev, tempMessage]);
  
  // 2. Socket emission
  socket.emit('send_message', {
    receiverId,
    content,
    tempId: tempMessage.id
  });
  
  // 3. Clear input
  setNewMessage('');
};
```

**Socket Context** (`SocketContext.jsx`):
```javascript
// sendMessage function in context
const sendMessage = (receiverId, message) => {
  if (socket && socket.connected) {
    // 1. Emit through socket
    socket.emit('send_message', {
      receiverId,
      message,
      timestamp: new Date()
    });
  } else {
    console.error('Socket not connected');
  }
};
```

**Backend Socket Server** (`socket/socketServer.js`):
```javascript
socket.on('send_message', async (data) => {
  try {
    // 1. Validate data
    if (!data.receiverId || !data.message) {
      socket.emit('error', 'Invalid message data');
      return;
    }
    
    // 2. Save to database
    const message = await Chat.create({
      senderId: socket.userId,
      receiverId: data.receiverId,
      content: data.message,
      timestamp: new Date(),
      messageType: 'text'
    });
    
    // 3. Get sender info
    const sender = await User.findById(socket.userId)
      .select('name avatar');
    
    // 4. Prepare message data
    const messageData = {
      _id: message._id,
      senderId: socket.userId,
      senderName: sender.name,
      content: data.message,
      timestamp: message.timestamp
    };
    
    // 5. Send to recipient if online
    io.to(data.receiverId).emit('new_message', messageData);
    
    // 6. Confirm to sender
    socket.emit('message_sent', {
      tempId: data.tempId,
      messageId: message._id
    });
    
  } catch (error) {
    socket.emit('error', 'Failed to send message');
  }
});
```

**Database Model** (`models/chat.model.js`):
```javascript
// Chat.create() execution
const chatSchema = new mongoose.Schema({
  senderId: { type: ObjectId, ref: 'User', required: true },
  receiverId: { type: ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'file'] },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

// 1. Validate schema
// 2. Save to MongoDB
// 3. Return saved document
```

## 📞 **Video Call Flow**

### **Call Initiation Process**

**Frontend Component** (`VideoCall.jsx`):
```javascript
const initiateCall = async (receiverId, callType) => {
  try {
    // 1. Get user media
    const stream = await navigator.mediaDevices.getUserMedia({
      video: callType === 'video',
      audio: true
    });
    setLocalStream(stream);
    
    // 2. Create peer connection
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    // 3. Add local stream
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });
    
    // 4. Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
    
    // 5. Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_ice_candidate', {
          targetId: receiverId,
          candidate: event.candidate
        });
      }
    };
    
    // 6. Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    // 7. Send call initiation
    socket.emit('initiate_call', {
      receiverId,
      callType,
      offer
    });
    
    setPeerConnection(pc);
    
  } catch (error) {
    console.error('Failed to initiate call:', error);
  }
};
```

**Backend Socket Handler**:
```javascript
socket.on('initiate_call', async (data) => {
  try {
    // 1. Create call record
    const call = await Call.create({
      callerId: socket.userId,
      receiverId: data.receiverId,
      callType: data.callType,
      status: 'ringing',
      startTime: new Date()
    });
    
    // 2. Get caller info
    const caller = await User.findById(socket.userId)
      .select('name avatar');
    
    // 3. Notify recipient
    io.to(data.receiverId).emit('incoming_call', {
      callId: call._id,
      callerId: socket.userId,
      callerName: caller.name,
      callType: data.callType,
      offer: data.offer
    });
    
    // 4. Confirm to caller
    socket.emit('call_initiated', {
      callId: call._id,
      status: 'ringing'
    });
    
  } catch (error) {
    socket.emit('call_error', 'Failed to initiate call');
  }
});
```

This execution flow shows exactly how code runs from user interaction to database storage and back to the user interface. Every step is traceable and follows a clear pattern throughout the application.
