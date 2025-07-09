# 🧪 Testing Communication Features

## Quick Test Guide for Audio/Video Calling System

### 🎯 **Prerequisites**
- Both backend (port 5000) and frontend (port 3000) servers running
- At least 2 browser tabs/windows for testing
- Microphone and camera permissions granted

### 📋 **Test Checklist**

#### ✅ **1. Real-time Chat Testing**

**Step 1: Setup**
- Open http://localhost:3000 in **Browser Tab 1**
- Login as patient: `patient@test.com` / `password123`
- Open http://localhost:3000 in **Browser Tab 2** 
- Login as doctor: `sarah.johnson@hospital.com` / `password123`

**Step 2: Start Chat**
- **Tab 1 (Patient)**: Click "Messages" icon in navbar
- Click "Start New Chat" or find existing conversation
- Send message: "Hello Doctor, I need consultation"

**Step 3: Verify Real-time**
- **Tab 2 (Doctor)**: Should see notification appear
- Click "Messages" icon, see new message
- Reply: "Hello! How can I help you today?"
- **Tab 1**: Should see reply instantly

**Expected Results:**
- ✅ Messages appear in real-time
- ✅ Typing indicators work
- ✅ Timestamps are accurate
- ✅ Notification badges update

#### ✅ **2. Video Call Testing**

**Step 1: Initiate Call**
- **Tab 1 (Patient)**: Go to doctor profile page
- Click **"Video"** button
- Grant camera/microphone permissions when prompted

**Step 2: Answer Call**
- **Tab 2 (Doctor)**: Should see incoming call notification
- Click **"Answer"** button
- Grant camera/microphone permissions

**Step 3: Test Call Features**
- Test **mute/unmute** audio
- Test **camera on/off**
- Check **video quality**
- Test **end call** button

**Expected Results:**
- ✅ Call connects successfully
- ✅ Audio/video streams work
- ✅ Controls function properly
- ✅ Call ends cleanly

#### ✅ **3. Audio Call Testing**

**Step 1: Start Audio Call**
- **Tab 1**: Click **"Call"** button on doctor profile
- Or use phone icon in chat interface

**Step 2: Test Audio Quality**
- Speak and verify audio transmission
- Test mute/unmute functionality
- Check call duration timer

**Expected Results:**
- ✅ Clear audio transmission
- ✅ No echo or feedback
- ✅ Mute controls work
- ✅ Call timer accurate

#### ✅ **4. Helpline Support Testing**

**Step 1: Access Helpline**
- Click **"Help"** icon in navbar
- Try **"Live Chat"** tab
- Send message: "I need technical support"

**Step 2: Create Support Ticket**
- Go to **"Support Tickets"** tab
- Fill out ticket form:
  - Category: "Technical Support"
  - Subject: "Login Issues"
  - Description: "Cannot access my account"
- Submit ticket

**Step 3: Test Emergency**
- Go to **"Emergency"** tab
- Click **"Call Emergency Helpline"**

**Expected Results:**
- ✅ Helpline chat works
- ✅ Tickets are created
- ✅ Emergency call initiates

#### ✅ **5. Notification System Testing**

**Step 1: Generate Notifications**
- Send messages between tabs
- Initiate calls
- Create support tickets

**Step 2: Check Notifications**
- Verify notification badges appear
- Check notification center
- Test notification dismissal

**Expected Results:**
- ✅ Real-time notifications
- ✅ Accurate badge counts
- ✅ Notifications can be dismissed

### 🔧 **Troubleshooting Common Issues**

#### **Issue: No Audio/Video**
**Solution:**
- Check browser permissions for camera/microphone
- Try refreshing the page
- Use Chrome for best compatibility

#### **Issue: Connection Failed**
**Solution:**
- Verify both servers are running
- Check browser console for errors
- Ensure ports 3000 and 5000 are accessible

#### **Issue: Messages Not Real-time**
**Solution:**
- Check Socket.io connection status (green dot in navbar)
- Refresh browser tabs
- Check network connectivity

#### **Issue: Call Quality Poor**
**Solution:**
- Check internet connection speed
- Close other bandwidth-heavy applications
- Try audio-only call instead of video

### 📊 **Test Results Verification**

#### **Backend Verification**
```bash
# Check Socket.io connections
curl http://localhost:5000/health

# Verify API endpoints
curl http://localhost:5000/api/chat/conversations
curl http://localhost:5000/api/calls/history
curl http://localhost:5000/api/helpline/categories
```

#### **Frontend Verification**
- Check browser console for errors
- Verify Socket.io connection in Network tab
- Test responsive design on mobile

### 🎯 **Advanced Testing Scenarios**

#### **Multi-user Testing**
1. Open 3+ browser tabs with different users
2. Create group conversations
3. Test multiple simultaneous calls
4. Verify notification distribution

#### **Network Resilience Testing**
1. Disconnect/reconnect internet during call
2. Test automatic reconnection
3. Verify message delivery after reconnection

#### **Performance Testing**
1. Send 100+ messages rapidly
2. Test with multiple concurrent calls
3. Monitor memory usage and performance

### ✅ **Success Criteria**

Your communication system is working correctly if:

- ✅ **Real-time messaging** works instantly
- ✅ **Audio calls** have clear sound quality
- ✅ **Video calls** show video streams properly
- ✅ **Notifications** appear in real-time
- ✅ **Helpline support** is accessible
- ✅ **Emergency features** function correctly
- ✅ **Call history** is recorded accurately
- ✅ **User interface** is responsive and intuitive

### 🚀 **Ready for Production**

Once all tests pass, your Doctor Appointment Booking System has:

- **Complete telemedicine capabilities**
- **Professional-grade communication features**
- **Emergency support system**
- **Real-time patient-doctor interaction**
- **Comprehensive helpline support**

**Your healthcare platform is now ready for real-world deployment!** 🏥✨
