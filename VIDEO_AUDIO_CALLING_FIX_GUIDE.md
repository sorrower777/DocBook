# Video/Audio Calling Troubleshooting Guide

## Issues Fixed

### 1. WebRTC Configuration Issues
- **Problem**: Basic ICE server configuration causing connection failures
- **Solution**: Enhanced ICE server configuration with multiple STUN servers and connection pool
- **Location**: `client/src/hooks/useWebRTC.js`

### 2. Media Stream Handling
- **Problem**: Poor audio/video quality and device access issues
- **Solution**: Enhanced getUserMedia constraints with better audio processing
- **Features Added**:
  - Echo cancellation
  - Noise suppression
  - Auto gain control
  - Better video resolution settings

### 3. Signaling Protocol
- **Problem**: Incomplete offer/answer exchange
- **Solution**: Proper signaling state management and error handling
- **Features Added**:
  - Better logging for debugging
  - Proper state validation before setting remote descriptions
  - ICE restart capability on connection failures

### 4. Call State Management
- **Problem**: Missing integration between call initiation and video interface
- **Solution**: Enhanced call state management in NotificationCenter
- **Features Added**:
  - Proper active call tracking
  - Outgoing call support
  - Better call data structure

## Testing & Debugging

### WebRTC Debug Tool
Access the WebRTC debugger at: `http://localhost:3000/test-webrtc`

This tool helps diagnose:
- Device availability (camera/microphone)
- WebRTC browser support
- Media stream creation
- Peer connection establishment
- ICE candidate gathering

### Common Issues & Solutions

#### 1. "Could not access camera/microphone"
**Causes:**
- Browser permissions not granted
- Camera/microphone in use by another application
- Running on HTTP (not HTTPS) in production

**Solutions:**
1. Ensure browser permissions are granted
2. Close other applications using camera/microphone
3. Use HTTPS in production (WebRTC requires secure context)

#### 2. "Connection failed"
**Causes:**
- Network firewall blocking WebRTC traffic
- NAT traversal issues
- Server connectivity problems

**Solutions:**
1. Check network firewall settings
2. Test on different networks
3. Verify server is running and accessible

#### 3. "No audio/video in call"
**Causes:**
- Media tracks not properly added to peer connection
- Remote stream not received
- Browser compatibility issues

**Solutions:**
1. Test with WebRTC debugger first
2. Check browser developer console for errors
3. Ensure both users have granted media permissions

#### 4. One-way audio/video
**Causes:**
- Asymmetric NAT configuration
- Incomplete offer/answer exchange
- Track direction not properly set

**Solutions:**
1. Check ICE connection state in debug logs
2. Verify both offer and answer are exchanged
3. Test with different network configurations

## Browser Compatibility

### Supported Browsers:
- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

### Required Features:
- WebRTC support
- getUserMedia API
- Secure context (HTTPS in production)

## Production Deployment Notes

### HTTPS Requirement
WebRTC requires HTTPS in production. Ensure your deployment:
1. Uses SSL certificates
2. Serves all content over HTTPS
3. WebSocket connections use WSS (not WS)

### TURN Servers (for production)
For production deployment, consider adding TURN servers for NAT traversal:

```javascript
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'your-username',
      credential: 'your-password'
    }
  ]
};
```

### Environment Variables
Ensure proper environment variables are set:
- `REACT_APP_API_URL`: Your backend API URL
- `CLIENT_URL`: Your frontend URL (in server .env)

## Testing Checklist

Before deploying:
1. [ ] Test camera/microphone access
2. [ ] Test call initiation (both directions)
3. [ ] Test audio/video toggle functionality
4. [ ] Test call ending
5. [ ] Test on different browsers
6. [ ] Test on different networks
7. [ ] Test HTTPS deployment
8. [ ] Verify socket connections are stable

## Debug Commands

### Start application with debug mode:
```bash
# Windows
npm run start:debug

# Linux/Mac
DEBUG=* npm start
```

### Check WebRTC stats:
Open browser developer tools and run:
```javascript
// In the console during a call
pc.getStats().then(stats => {
  stats.forEach(report => {
    console.log(report);
  });
});
```

### Monitor socket events:
```javascript
// In browser console
socket.onAny((event, ...args) => {
  console.log(`Socket event: ${event}`, args);
});
```

## Support

If issues persist:
1. Check browser developer console for errors
2. Use the WebRTC debugger tool
3. Test with the communication test page
4. Verify server logs for any backend issues
5. Test with minimal setup (two users, same network)

## Recent Updates

- Enhanced ICE server configuration
- Improved media constraints for better quality
- Added comprehensive error handling
- Better state management for calls
- Debug tools for troubleshooting
- Proper signaling protocol implementation
