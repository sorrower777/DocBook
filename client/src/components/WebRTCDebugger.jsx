import React, { useState, useEffect } from 'react';
import { FiVideo, FiPhone, FiMic, FiMicOff, FiVideoOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const WebRTCDebugger = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState(null);

  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  useEffect(() => {
    checkDevices();
  }, []);

  const checkDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      const info = {
        videoDevices: videoDevices.length,
        audioDevices: audioDevices.length,
        hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
        hasWebRTC: !!window.RTCPeerConnection,
        isSecureContext: window.isSecureContext
      };
      
      setDeviceInfo(info);
      addLog(`Found ${videoDevices.length} video and ${audioDevices.length} audio devices`);
      addLog(`WebRTC supported: ${info.hasWebRTC}, Secure context: ${info.isSecureContext}`);
    } catch (error) {
      addLog(`Error checking devices: ${error.message}`, 'error');
    }
  };

  const testGetUserMedia = async () => {
    try {
      addLog('Testing getUserMedia...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(stream);
      addLog('✅ getUserMedia successful');
      addLog(`Got ${stream.getVideoTracks().length} video tracks and ${stream.getAudioTracks().length} audio tracks`);
      
      // Display stream info
      stream.getTracks().forEach(track => {
        addLog(`Track: ${track.kind}, enabled: ${track.enabled}, ready: ${track.readyState}`);
      });

    } catch (error) {
      addLog(`❌ getUserMedia failed: ${error.message}`, 'error');
    }
  };

  const testPeerConnection = async () => {
    try {
      addLog('Testing RTCPeerConnection...');
      
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addLog(`ICE candidate: ${event.candidate.type} ${event.candidate.protocol}`);
        } else {
          addLog('ICE gathering complete');
        }
      };

      pc.onconnectionstatechange = () => {
        addLog(`Connection state: ${pc.connectionState}`);
      };

      pc.oniceconnectionstatechange = () => {
        addLog(`ICE connection state: ${pc.iceConnectionState}`);
      };

      if (localStream) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
          addLog(`Added ${track.kind} track to peer connection`);
        });
      }

      setPeerConnection(pc);
      addLog('✅ RTCPeerConnection created successfully');

    } catch (error) {
      addLog(`❌ RTCPeerConnection failed: ${error.message}`, 'error');
    }
  };

  const testOffer = async () => {
    if (!peerConnection) {
      addLog('No peer connection available', 'error');
      return;
    }

    try {
      addLog('Creating offer...');
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      addLog('✅ Offer created and set as local description');
      addLog(`Offer SDP length: ${offer.sdp.length} characters`);
    } catch (error) {
      addLog(`❌ Offer creation failed: ${error.message}`, 'error');
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        addLog(`Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        addLog(`Audio ${audioTrack.enabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  const stopStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      addLog('Stream stopped');
    }
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
      addLog('Peer connection closed');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">WebRTC Debugger & Test Tool</h1>

      {/* Device Info */}
      {deviceInfo && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Device Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Video Devices: {deviceInfo.videoDevices}</div>
            <div>Audio Devices: {deviceInfo.audioDevices}</div>
            <div>WebRTC Support: {deviceInfo.hasWebRTC ? '✅' : '❌'}</div>
            <div>Secure Context: {deviceInfo.isSecureContext ? '✅' : '❌'}</div>
            <div>Socket Connected: {isConnected ? '✅' : '❌'}</div>
            <div>User: {user?.name || 'Not logged in'}</div>
          </div>
        </div>
      )}

      {/* Video Preview */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Video Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Local Stream</h4>
            <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
              {localStream ? (
                <video
                  ref={ref => ref && (ref.srcObject = localStream)}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-gray-500">No local stream</div>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Remote Stream</h4>
            <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
              {remoteStream ? (
                <video
                  ref={ref => ref && (ref.srcObject = remoteStream)}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-gray-500">No remote stream</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={testGetUserMedia}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Camera/Mic
        </button>
        <button
          onClick={testPeerConnection}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test Peer Connection
        </button>
        <button
          onClick={testOffer}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Test Offer
        </button>
        <button
          onClick={toggleVideo}
          className={`px-4 py-2 rounded text-white ${isVideoEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'}`}
        >
          <FiVideo className="inline mr-1" />
          Video {isVideoEnabled ? 'On' : 'Off'}
        </button>
        <button
          onClick={toggleAudio}
          className={`px-4 py-2 rounded text-white ${isAudioEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'}`}
        >
          <FiMic className="inline mr-1" />
          Audio {isAudioEnabled ? 'On' : 'Off'}
        </button>
        <button
          onClick={stopStream}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Stop All
        </button>
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear Logs
        </button>
      </div>

      {/* Logs */}
      <div className="bg-black text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
        <div className="mb-2 text-gray-400">--- WebRTC Debug Logs ---</div>
        {logs.map((log, index) => (
          <div
            key={index}
            className={`mb-1 ${
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'warning' ? 'text-yellow-400' : 
              'text-green-400'
            }`}
          >
            [{log.timestamp}] {log.message}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-500">No logs yet. Click a test button to start.</div>
        )}
      </div>
    </div>
  );
};

export default WebRTCDebugger;
