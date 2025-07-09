# 🧪 Complete Website Testing Guide

## 🚀 **Pre-Testing Setup**

### **1. Ensure Servers Are Running**
```bash
# Terminal 1 - Backend
cd server
npm run dev
# Should show: Server running on port 5000

# Terminal 2 - Frontend  
cd client
npm start
# Should open http://localhost:3000
```

### **2. Verify System Status**
- ✅ Backend: http://localhost:5000/health
- ✅ Frontend: http://localhost:3000
- ✅ Database: 52 doctors populated

## 📋 **Complete Testing Checklist**

### **Phase 1: Basic Website Functionality**

#### **1.1 Homepage Testing**
- [ ] Open http://localhost:3000
- [ ] Verify 52 doctors are displayed
- [ ] Test specialty filter dropdown
- [ ] Test search functionality
- [ ] Check responsive design (resize browser)
- [ ] Verify doctor cards show: name, specialty, experience, fee

#### **1.2 Authentication Testing**
```
Patient Registration:
- [ ] Click "Sign Up" → Select "Patient"
- [ ] Fill: Name, Email, Password
- [ ] Submit and verify success message
- [ ] Login with new credentials

Doctor Registration:
- [ ] Click "Sign Up" → Select "Doctor"  
- [ ] Fill all medical details
- [ ] Submit (will be pending verification)
- [ ] Try login (should work but show verification message)

Test Accounts Login:
- [ ] Patient: patient@test.com / password123
- [ ] Doctor: sarah.johnson@hospital.com / password123
```

#### **1.3 Doctor Profile Pages**
- [ ] Click any doctor from homepage
- [ ] Verify profile shows: photo, details, availability, fee
- [ ] Check "Book Now" button works
- [ ] Test communication buttons (Chat, Call, Video)

### **Phase 2: Appointment Booking System**

#### **2.1 Booking Flow (As Patient)**
```
1. Login as patient
2. Find doctor → Click "Book Now"
3. Select future date
4. Choose available time slot
5. Add reason for visit
6. Submit booking
7. Verify success message
8. Check Patient Dashboard for appointment
```

#### **2.2 Appointment Management (As Doctor)**
```
1. Login as doctor
2. Go to Doctor Dashboard
3. View pending appointments
4. Confirm/reject appointments
5. Mark appointments as completed
6. Add notes to appointments
```

#### **2.3 Dashboard Testing**
```
Patient Dashboard:
- [ ] View upcoming appointments
- [ ] View past appointments  
- [ ] Cancel appointments
- [ ] Check appointment statistics

Doctor Dashboard:
- [ ] View today's appointments
- [ ] View all upcoming appointments
- [ ] Manage appointment status
- [ ] View profile summary
```

### **Phase 3: Communication Features Testing**

#### **3.1 Real-time Chat Testing**
```
Setup (2 Browser Tabs):
Tab 1: Login as patient
Tab 2: Login as doctor

Test Steps:
1. Tab 1: Go to doctor profile → Click "Chat"
2. Send message: "Hello Doctor, I need consultation"
3. Tab 2: Click "Messages" icon → Should see notification
4. Reply: "Hello! How can I help you?"
5. Tab 1: Should see reply instantly
6. Test typing indicators
7. Test message timestamps
8. Test chat history
```

#### **3.2 Video Call Testing**
```
Prerequisites: Grant camera/microphone permissions

Test Steps:
1. Tab 1 (Patient): Click "Video" on doctor profile
2. Should see "Calling..." interface
3. Tab 2 (Doctor): Should see incoming call notification
4. Click "Answer" button
5. Both tabs should show video call interface
6. Test controls:
   - [ ] Mute/unmute audio
   - [ ] Turn camera on/off
   - [ ] End call button
7. Verify call appears in call history
```

#### **3.3 Audio Call Testing**
```
Test Steps:
1. Tab 1: Click "Call" button on doctor profile
2. Tab 2: Answer incoming audio call
3. Test audio quality
4. Test mute/unmute
5. Test call duration timer
6. End call and verify history
```

#### **3.4 Helpline Support Testing**
```
Live Chat Test:
1. Click "Help" icon in navbar
2. Go to "Live Chat" tab
3. Send message: "I need technical support"
4. Verify message appears

Support Ticket Test:
1. Go to "Support Tickets" tab
2. Fill form:
   - Category: "Technical Support"
   - Subject: "Login Issues"
   - Description: "Cannot access my account"
   - Priority: "Medium"
3. Submit ticket
4. Verify ticket appears in recent tickets

Emergency Test:
1. Go to "Emergency" tab
2. Click "Call Emergency Helpline"
3. Verify emergency call initiates
```

### **Phase 4: Advanced Features Testing**

#### **4.1 Notification System**
```
Test Scenarios:
1. Send messages between users → Check notification badges
2. Make calls → Verify call notifications
3. Create support tickets → Check helpline notifications
4. Test notification dismissal
5. Check notification center
```

#### **4.2 Multi-user Testing**
```
Setup (3+ Browser Tabs):
- Tab 1: Patient 1
- Tab 2: Patient 2  
- Tab 3: Doctor

Test:
1. Multiple patients chat with same doctor
2. Doctor receives multiple notifications
3. Test call queue (one call at a time)
4. Verify message delivery to correct users
```

#### **4.3 Connection Resilience**
```
Test Network Issues:
1. Start video call
2. Disconnect internet briefly
3. Reconnect → Verify auto-reconnection
4. Test message delivery after reconnection
```

## 🔧 **Debug Testing Tools**

### **1. Communication Test Page**
- Visit: http://localhost:3000/test-communication
- Use test buttons to verify each feature
- Check connection status and debug info

### **2. Browser Developer Tools**
```
Open F12 Developer Tools:
1. Console Tab: Check for JavaScript errors
2. Network Tab: Monitor API calls
3. Application Tab: Check localStorage for tokens
```

### **3. Server Logs**
- Monitor backend terminal for real-time logs
- Check for Socket.io connection messages
- Verify API request/response logs

## 🎯 **Specific Test Scenarios**

### **Scenario 1: Complete Patient Journey**
```
1. Register as new patient
2. Browse doctors by specialty
3. View doctor profile
4. Book appointment
5. Chat with doctor before appointment
6. Make video call for consultation
7. Rate the consultation
8. View appointment history
```

### **Scenario 2: Doctor Workflow**
```
1. Login as doctor
2. Check today's appointments
3. Respond to patient messages
4. Accept incoming video call
5. Conduct consultation
6. Mark appointment as completed
7. Add consultation notes
```

### **Scenario 3: Emergency Support**
```
1. Patient has urgent issue
2. Access helpline support
3. Create emergency ticket
4. Use emergency call feature
5. Get immediate assistance
```

## 📱 **Cross-Browser Testing**

### **Test in Multiple Browsers**
- [ ] **Chrome** (Primary - best WebRTC support)
- [ ] **Firefox** (Good compatibility)
- [ ] **Safari** (macOS/iOS testing)
- [ ] **Edge** (Windows testing)

### **Mobile Responsiveness**
- [ ] Resize browser to mobile size
- [ ] Test touch interactions
- [ ] Verify responsive layout
- [ ] Test mobile camera/microphone access

## 🚨 **Error Testing**

### **Test Error Scenarios**
```
1. Invalid login credentials
2. Booking appointment in past date
3. Calling offline user
4. Network disconnection during call
5. Invalid form submissions
6. Unauthorized access attempts
```

## ✅ **Success Criteria**

### **Your website passes testing if:**
- [ ] All 52 doctors display correctly
- [ ] Authentication works for all user types
- [ ] Appointment booking flow completes
- [ ] Real-time chat works between users
- [ ] Video/audio calls connect successfully
- [ ] Helpline support is accessible
- [ ] Notifications appear in real-time
- [ ] No critical JavaScript errors
- [ ] Responsive design works on all screen sizes

## 🎉 **Testing Complete!**

Once you've completed all tests, your Doctor Appointment Booking System with communication features is ready for:

- **Production deployment**
- **Real user testing**
- **Healthcare provider implementation**
- **Patient onboarding**

## 🔗 **Quick Test Links**

- **Main App**: http://localhost:3000
- **Test Page**: http://localhost:3000/test-communication
- **API Health**: http://localhost:5000/health

**Start with Phase 1 and work through each phase systematically!** 🚀
