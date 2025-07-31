import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const SimpleWebRTCTest = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [roomId, setRoomId] = useState('test-room-123');
  const [isInitiator, setIsInitiator] = useState(false);
  const [connectionState, setConnectionState] = useState('new');
  const [logs, setLogs] = useState([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const { socket } = useSocket();

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  // Initialize WebRTC
  const initWebRTC = async () => {
    try {
      addLog('🚀 Starting WebRTC test...');

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      addLog('✅ Got local media stream');

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      // Add event listeners
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          addLog('📤 Sending ICE candidate');
          socket.emit('webrtc_ice_candidate', {
            roomId,
            candidate: event.candidate
          });
        }
      };

      pc.ontrack = (event) => {
        addLog('📥 Received remote track');
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        setConnectionState(state);
        addLog(`🔗 Connection state: ${state}`);
      };

      // Add local stream
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      setPeerConnection(pc);
      addLog('✅ Peer connection created');

    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
    }
  };

  // Start as initiator
  const startCall = async () => {
    if (!peerConnection || !socket) {
      addLog('❌ No peer connection or socket');
      return;
    }

    try {
      setIsInitiator(true);
      addLog('📞 Creating offer...');

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit('webrtc_offer', { roomId, offer });
      addLog('📤 Offer sent');

    } catch (error) {
      addLog(`❌ Offer error: ${error.message}`);
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async (data) => {
      if (data.senderId === socket.id) return;

      addLog('📥 Received offer');
      try {
        await peerConnection.setRemoteDescription(data.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('webrtc_answer', { roomId, answer });
        addLog('📤 Answer sent');

      } catch (error) {
        addLog(`❌ Answer error: ${error.message}`);
      }
    };

    const handleAnswer = async (data) => {
      if (data.senderId === socket.id) return;

      addLog('📥 Received answer');
      try {
        await peerConnection.setRemoteDescription(data.answer);
        addLog('✅ Answer processed');

      } catch (error) {
        addLog(`❌ Set remote desc error: ${error.message}`);
      }
    };

    const handleIceCandidate = async (data) => {
      if (data.senderId === socket.id) return;

      addLog('📥 Received ICE candidate');
      try {
        await peerConnection.addIceCandidate(data.candidate);
        addLog('✅ ICE candidate added');

      } catch (error) {
        addLog(`❌ ICE error: ${error.message}`);
      }
    };

    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);

    return () => {
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
    };
  }, [socket, peerConnection, roomId]);

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    setRemoteStream(null);
    setConnectionState('new');
    addLog('🧹 Cleaned up');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Simple WebRTC Test</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={initWebRTC}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Initialize WebRTC
        </button>
        <button
          onClick={startCall}
          disabled={!peerConnection}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Start Call (Initiator)
        </button>
        <button
          onClick={cleanup}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Cleanup
        </button>
      </div>

      <div className="mb-4 p-3 bg-gray-100 rounded">
        <strong>Status:</strong> Connection: {connectionState} | 
        Socket: {socket ? '✅' : '❌'} | 
        Role: {isInitiator ? 'Initiator' : 'Receiver'} |
        Room: {roomId}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="font-semibold mb-2">Local Video</h3>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-video bg-gray-200 rounded"
          />
        </div>
        <div>
          <h3 className="font-semibold mb-2">Remote Video</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full aspect-video bg-gray-200 rounded"
          />
        </div>
      </div>

      <div className="bg-black text-green-400 p-4 rounded h-48 overflow-y-auto font-mono text-sm">
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Open this page in two browser tabs</li>
          <li>Login as different users in each tab</li>
          <li>Click "Initialize WebRTC" in both tabs</li>
          <li>Click "Start Call" in ONE tab only</li>
          <li>Watch the logs and videos</li>
        </ol>
      </div>
    </div>
  );
};

export default SimpleWebRTCTest;
