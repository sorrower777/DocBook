import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

const useWebRTC = (roomId, isInitiator = false) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callError, setCallError] = useState(null);
  const [connectionState, setConnectionState] = useState('new');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const { socket, sendWebRTCOffer, sendWebRTCAnswer, sendICECandidate } = useSocket();

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
  };

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    console.log('Initializing peer connection with ICE servers:', iceServers);
    const peerConnection = new RTCPeerConnection(iceServers);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      console.log('ICE candidate generated:', event.candidate);
      if (event.candidate && roomId) {
        sendICECandidate(roomId, event.candidate);
      } else if (!event.candidate) {
        console.log('ICE candidate gathering complete');
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event);
      const [remoteStream] = event.streams;
      console.log('Setting remote stream:', remoteStream);
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log('Connection state changed to:', state);
      setConnectionState(state);
      
      if (state === 'connected') {
        console.log('✅ Peer connection established successfully');
        setIsCallActive(true);
        setCallError(null);
      } else if (state === 'failed') {
        console.error('❌ Peer connection failed');
        setCallError('Connection failed - please check your network');
        setIsCallActive(false);
      } else if (state === 'disconnected') {
        console.log('📱 Peer connection disconnected');
        setIsCallActive(false);
      } else if (state === 'closed') {
        console.log('🔒 Peer connection closed');
        setIsCallActive(false);
      }
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      const iceState = peerConnection.iceConnectionState;
      console.log('ICE connection state changed to:', iceState);
      
      if (iceState === 'failed' || iceState === 'disconnected') {
        console.error('ICE connection failed/disconnected');
        setCallError('Network connection issues detected');
        
        // Attempt ICE restart
        if (peerConnection.restartIce) {
          console.log('Attempting ICE restart...');
          peerConnection.restartIce();
        }
      } else if (iceState === 'connected' || iceState === 'completed') {
        console.log('✅ ICE connection established');
        setCallError(null);
      }
    };

    // Handle data channel events
    peerConnection.ondatachannel = (event) => {
      console.log('Data channel received:', event.channel);
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [roomId, sendICECandidate, iceServers]);

  // Get user media (camera and microphone)
  const getUserMedia = useCallback(async (video = true, audio = true) => {
    try {
      const constraints = {
        video: video ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true
        } : false
      };

      console.log('Requesting media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got media stream:', stream);
      
      setLocalStream(stream);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setCallError(`Could not access camera/microphone: ${error.message}`);
      throw error;
    }
  }, []);

  // Start call (for initiator)
  const startCall = useCallback(async (video = true, audio = true) => {
    try {
      console.log('🚀 Starting call with video:', video, 'audio:', audio);
      setCallError(null);
      
      // Get user media first
      const stream = await getUserMedia(video, audio);
      console.log('📷 Got local media stream');
      
      // Initialize peer connection
      const peerConnection = initializePeerConnection();
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        console.log('📡 Adding track to peer connection:', track);
        peerConnection.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await peerConnection.createOffer({
        offerToReceiveVideo: video,
        offerToReceiveAudio: audio
      });
      
      await peerConnection.setLocalDescription(offer);
      console.log('✅ Local description set (offer):', offer);
      
      if (roomId) {
        sendWebRTCOffer(roomId, offer);
        console.log('📤 Offer sent to room:', roomId);
      }

      setIsVideoEnabled(video);
      setIsAudioEnabled(audio);
      
    } catch (error) {
      console.error('❌ Error starting call:', error);
      setCallError(`Failed to start call: ${error.message}`);
    }
  }, [getUserMedia, initializePeerConnection, roomId, sendWebRTCOffer]);

  // Answer call (for receiver)
  const answerCall = useCallback(async (video = true, audio = true) => {
    try {
      setCallError(null);
      
      // Get user media
      const stream = await getUserMedia(video, audio);
      
      // Initialize peer connection
      const peerConnection = initializePeerConnection();
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      setIsVideoEnabled(video);
      setIsAudioEnabled(audio);
      
    } catch (error) {
      console.error('Error answering call:', error);
      setCallError('Failed to answer call');
    }
  }, [getUserMedia, initializePeerConnection]);

  // Handle incoming offer
  const handleOffer = useCallback(async (offer) => {
    try {
      console.log('Handling incoming offer:', offer);
      const peerConnection = peerConnectionRef.current || initializePeerConnection();
      
      // Set the remote description
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('✅ Remote description set (offer)');
      
      // Create and set local description (answer)
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      console.log('✅ Local description set (answer):', answer);
      
      // Send answer back
      if (roomId) {
        sendWebRTCAnswer(roomId, answer);
        console.log('📤 Answer sent to room:', roomId);
      }
    } catch (error) {
      console.error('❌ Error handling offer:', error);
      setCallError(`Failed to handle incoming call: ${error.message}`);
    }
  }, [initializePeerConnection, roomId, sendWebRTCAnswer]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (answer) => {
    try {
      console.log('Handling incoming answer:', answer);
      const peerConnection = peerConnectionRef.current;
      if (peerConnection && peerConnection.signalingState !== 'stable') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('✅ Remote description set (answer)');
      } else {
        console.warn('⚠️ Cannot set remote description - invalid state:', peerConnection?.signalingState);
      }
    } catch (error) {
      console.error('❌ Error handling answer:', error);
      setCallError(`Failed to establish connection: ${error.message}`);
    }
  }, []);

  // Handle incoming ICE candidate
  const handleICECandidate = useCallback(async (candidate) => {
    try {
      console.log('Handling ICE candidate:', candidate);
      const peerConnection = peerConnectionRef.current;
      if (peerConnection && peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ ICE candidate added');
      } else {
        console.warn('⚠️ Cannot add ICE candidate - no remote description set');
      }
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
      // Don't set call error for ICE candidate failures as they're not critical
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // End call
  const endCall = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Reset states
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    setCallError(null);
    setConnectionState('new');

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    localStreamRef.current = null;
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleWebRTCOffer = (data) => {
      if (data.senderId !== socket.id) {
        handleOffer(data.offer);
      }
    };

    const handleWebRTCAnswer = (data) => {
      if (data.senderId !== socket.id) {
        handleAnswer(data.answer);
      }
    };

    const handleWebRTCICE = (data) => {
      if (data.senderId !== socket.id) {
        handleICECandidate(data.candidate);
      }
    };

    socket.on('webrtc_offer', handleWebRTCOffer);
    socket.on('webrtc_answer', handleWebRTCAnswer);
    socket.on('webrtc_ice_candidate', handleWebRTCICE);

    return () => {
      socket.off('webrtc_offer', handleWebRTCOffer);
      socket.off('webrtc_answer', handleWebRTCAnswer);
      socket.off('webrtc_ice_candidate', handleWebRTCICE);
    };
  }, [socket, roomId, handleOffer, handleAnswer, handleICECandidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    localStream,
    remoteStream,
    isCallActive,
    isVideoEnabled,
    isAudioEnabled,
    callError,
    connectionState,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    endCall,
    toggleVideo,
    toggleAudio,
    handleOffer,
    handleAnswer,
    handleICECandidate
  };
};

export default useWebRTC;
