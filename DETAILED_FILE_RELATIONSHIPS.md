# 🔗 Detailed File Relationships & Code Connections

## 📁 **Complete File Structure with Relationships**

```
doctor-appointment-system/
├── 📁 server/                          # Backend Node.js Application
│   ├── 📄 server.js                    # 🎯 MAIN ENTRY POINT
│   │   ├── imports → routes/*.js       # Route handlers
│   │   ├── imports → socket/socketServer.js  # Real-time communication
│   │   ├── imports → middleware/auth.middleware.js  # Authentication
│   │   └── connects → MongoDB via mongoose
│   │
│   ├── 📁 models/                      # Database Schemas
│   │   ├── 📄 user.model.js           # Base user data (patients & doctors)
│   │   ├── 📄 doctorProfile.model.js  # Doctor-specific information
│   │   ├── 📄 appointment.model.js    # Appointment booking data
│   │   ├── 📄 chat.model.js          # Chat messages & conversations
│   │   ├── 📄 call.model.js          # Call records & history
│   │   ├── 📄 helplineTicket.model.js # Support tickets
│   │   └── 📄 index.js               # Exports all models
│   │
│   ├── 📁 routes/                     # API Endpoint Handlers
│   │   ├── 📄 auth.routes.js         # POST /api/auth/register, /login
│   │   │   └── uses → models/user.model.js
│   │   ├── 📄 doctor.routes.js       # GET /api/doctors, /doctors/:id
│   │   │   └── uses → models/doctorProfile.model.js
│   │   ├── 📄 appointment.routes.js  # POST /api/appointments
│   │   │   └── uses → models/appointment.model.js
│   │   ├── 📄 chat.routes.js         # GET /api/chat/conversations
│   │   │   └── uses → models/chat.model.js
│   │   ├── 📄 call.routes.js         # POST /api/calls/initiate
│   │   │   └── uses → models/call.model.js
│   │   └── 📄 helpline.routes.js     # POST /api/helpline/tickets
│   │       └── uses → models/helplineTicket.model.js
│   │
│   ├── 📁 middleware/                 # Request Processing
│   │   └── 📄 auth.middleware.js     # JWT token verification
│   │       └── uses → models/user.model.js
│   │
│   ├── 📁 socket/                     # Real-time Communication
│   │   └── 📄 socketServer.js        # Socket.io event handlers
│   │       ├── uses → models/chat.model.js
│   │       ├── uses → models/call.model.js
│   │       └── uses → models/user.model.js
│   │
│   ├── 📄 seedData.js                # Database population script
│   └── 📄 package.json               # Dependencies & scripts
│
├── 📁 client/                         # Frontend React Application
│   ├── 📄 package.json               # Frontend dependencies
│   ├── 📁 public/                    # Static assets
│   └── 📁 src/                       # React source code
│       ├── 📄 index.js               # 🎯 REACT ENTRY POINT
│       │   └── renders → App.js
│       │
│       ├── 📄 App.js                 # Main application component
│       │   ├── imports → context/AuthContext.jsx
│       │   ├── imports → context/SocketContext.jsx
│       │   ├── imports → components/Navbar.jsx
│       │   ├── imports → components/NotificationCenter.jsx
│       │   ├── imports → pages/*.jsx
│       │   └── sets up → React Router
│       │
│       ├── 📁 context/               # Global State Management
│       │   ├── 📄 AuthContext.jsx   # User authentication state
│       │   │   └── uses → services/api.js
│       │   └── 📄 SocketContext.jsx # Real-time communication state
│       │       └── connects → server socket.io
│       │
│       ├── 📁 services/              # API Communication
│       │   └── 📄 api.js            # HTTP requests to backend
│       │       └── calls → server routes (HTTP)
│       │
│       ├── 📁 components/            # Reusable UI Components
│       │   ├── 📄 Navbar.jsx        # Navigation with auth status
│       │   │   └── uses → context/AuthContext.jsx
│       │   ├── 📄 DoctorCard.jsx    # Doctor listing display
│       │   ├── 📄 BookingForm.jsx   # Appointment booking
│       │   │   └── uses → services/api.js
│       │   ├── 📄 ChatInterface.jsx # Real-time messaging
│       │   │   └── uses → context/SocketContext.jsx
│       │   ├── 📄 VideoCall.jsx     # WebRTC video calling
│       │   │   ├── uses → context/SocketContext.jsx
│       │   │   └── uses → hooks/useWebRTC.js
│       │   ├── 📄 HelplineSupport.jsx # Support ticket system
│       │   ├── 📄 NotificationCenter.jsx # Real-time notifications
│       │   │   └── uses → context/SocketContext.jsx
│       │   ├── 📄 ProtectedRoute.jsx # Route authentication
│       │   │   └── uses → context/AuthContext.jsx
│       │   └── 📄 LoadingSpinner.jsx # Loading states
│       │
│       ├── 📁 pages/                # Full Page Components
│       │   ├── 📄 HomePage.jsx      # Landing page with doctor listings
│       │   │   └── uses → services/api.js
│       │   ├── 📄 LoginPage.jsx     # User authentication
│       │   │   └── uses → context/AuthContext.jsx
│       │   ├── 📄 RegisterPage.jsx  # User registration
│       │   │   └── uses → context/AuthContext.jsx
│       │   ├── 📄 DoctorProfilePage.jsx # Individual doctor details
│       │   │   ├── uses → services/api.js
│       │   │   └── uses → components/BookingForm.jsx
│       │   ├── 📄 PatientDashboard.jsx # Patient's main interface
│       │   │   ├── uses → context/AuthContext.jsx
│       │   │   ├── uses → components/ChatInterface.jsx
│       │   │   └── uses → services/api.js
│       │   └── 📄 DoctorDashboard.jsx # Doctor's main interface
│       │       ├── uses → context/AuthContext.jsx
│       │       └── uses → services/api.js
│       │
│       ├── 📁 hooks/                # Custom React Hooks
│       │   └── 📄 useWebRTC.js     # WebRTC functionality
│       │       └── uses → context/SocketContext.jsx
│       │
│       └── 📄 index.css             # Global styles (Tailwind CSS)
│
└── 📄 README.md                     # Project documentation
```

## 🔄 **Data Flow Relationships**

### **1. User Authentication Flow**
```
LoginPage.jsx → AuthContext.jsx → api.js → auth.routes.js → user.model.js → MongoDB
     ↓              ↓              ↓           ↓              ↓
   UI Form    Global State    HTTP POST   JWT Creation   Password Hash
```

### **2. Doctor Browsing Flow**
```
HomePage.jsx → api.js → doctor.routes.js → doctorProfile.model.js → MongoDB
     ↓          ↓           ↓                    ↓
  DoctorCard  HTTP GET   Route Handler      Database Query
```

### **3. Real-time Chat Flow**
```
ChatInterface.jsx → SocketContext.jsx → socketServer.js → chat.model.js → MongoDB
       ↓                 ↓                   ↓               ↓
   Send Message    Socket Emit         Event Handler    Save Message
       ↑                 ↑                   ↑               ↑
   Receive Msg    Socket Listen       Broadcast Msg    Retrieve Msgs
```

### **4. Video Call Flow**
```
VideoCall.jsx → useWebRTC.js → SocketContext.jsx → socketServer.js → call.model.js
     ↓              ↓              ↓                   ↓               ↓
  UI Controls   WebRTC Logic   Socket Events      Call Signaling   Call Record
```

### **5. Appointment Booking Flow**
```
BookingForm.jsx → api.js → appointment.routes.js → appointment.model.js → MongoDB
      ↓            ↓             ↓                      ↓
   Form Data   HTTP POST    Validation & Save      Database Insert
```

## 🔗 **Component Dependencies**

### **Frontend Component Hierarchy**
```
App.js
├── AuthProvider (AuthContext.jsx)
│   └── Provides: user, token, login(), logout()
├── SocketProvider (SocketContext.jsx)
│   └── Provides: socket, messages, notifications, sendMessage()
├── Navbar.jsx
│   └── Uses: AuthContext for user status
├── NotificationCenter.jsx
│   └── Uses: SocketContext for real-time notifications
└── Routes
    ├── HomePage.jsx
    │   ├── Uses: api.js for doctor data
    │   └── Renders: DoctorCard.jsx components
    ├── LoginPage.jsx
    │   └── Uses: AuthContext.login()
    ├── PatientDashboard.jsx
    │   ├── Uses: AuthContext for user data
    │   ├── Uses: api.js for appointments
    │   ├── Renders: ChatInterface.jsx
    │   └── Renders: VideoCall.jsx
    └── DoctorProfilePage.jsx
        ├── Uses: api.js for doctor details
        └── Renders: BookingForm.jsx
```

### **Backend Route Dependencies**
```
server.js
├── Registers: auth.routes.js
│   └── Uses: user.model.js, auth.middleware.js
├── Registers: doctor.routes.js
│   └── Uses: doctorProfile.model.js, auth.middleware.js
├── Registers: appointment.routes.js
│   └── Uses: appointment.model.js, auth.middleware.js
├── Registers: chat.routes.js
│   └── Uses: chat.model.js, auth.middleware.js
├── Registers: call.routes.js
│   └── Uses: call.model.js, auth.middleware.js
├── Registers: helpline.routes.js
│   └── Uses: helplineTicket.model.js, auth.middleware.js
└── Initializes: socketServer.js
    ├── Uses: user.model.js for authentication
    ├── Uses: chat.model.js for messages
    └── Uses: call.model.js for call records
```

## 📡 **Communication Protocols**

### **HTTP API Communication**
```
Frontend (api.js) ←→ Backend (routes/*.js)
    ↓                      ↓
Axios Requests         Express Routes
    ↓                      ↓
JWT Headers           Auth Middleware
    ↓                      ↓
JSON Data             Database Models
```

### **Socket.io Real-time Communication**
```
Frontend (SocketContext.jsx) ←→ Backend (socketServer.js)
         ↓                              ↓
    Socket Events                 Event Handlers
         ↓                              ↓
    UI Updates                   Database Updates
         ↓                              ↓
    Notifications               Broadcast to Users
```

### **WebRTC Peer-to-Peer Communication**
```
VideoCall.jsx ←→ useWebRTC.js ←→ SocketContext.jsx ←→ socketServer.js
     ↓               ↓               ↓                    ↓
  UI Controls   WebRTC API    Signaling Events    Relay Signals
     ↓               ↓               ↓                    ↓
  Media Stream   Peer Connection   Socket.io        Other Peer
```

This detailed relationship map shows how every file in your codebase connects and communicates with others. Each component has a specific purpose and clear dependencies, creating a well-structured healthcare application with real-time communication capabilities.
