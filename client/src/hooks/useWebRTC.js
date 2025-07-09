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
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection = new RTCPeerConnection(iceServers);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && roomId) {
        sendICECandidate(roomId, event.candidate);
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      setConnectionState(peerConnection.connectionState);
      console.log('Connection state:', peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'connected') {
        setIsCallActive(true);
        setCallError(null);
      } else if (peerConnection.connectionState === 'failed') {
        setCallError('Connection failed');
        setIsCallActive(false);
      } else if (peerConnection.connectionState === 'disconnected') {
        setIsCallActive(false);
      }
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
      
      if (peerConnection.iceConnectionState === 'failed') {
        setCallError('ICE connection failed');
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [roomId, sendICECandidate]);

  // Get user media (camera and microphone)
  const getUserMedia = useCallback(async (video = true, audio = true) => {
    try {
      const constraints = {
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setCallError('Could not access camera/microphone');
      throw error;
    }
  }, []);

  // Start call (for initiator)
  const startCall = useCallback(async (video = true, audio = true) => {
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

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      if (roomId) {
        sendWebRTCOffer(roomId, offer);
      }

      setIsVideoEnabled(video);
      setIsAudioEnabled(audio);
      
    } catch (error) {
      console.error('Error starting call:', error);
      setCallError('Failed to start call');
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
      const peerConnection = peerConnectionRef.current || initializePeerConnection();
      
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      if (roomId) {
        sendWebRTCAnswer(roomId, answer);
      }
    } catch (error) {
      console.error('Error handling offer:', error);
      setCallError('Failed to handle incoming call');
    }
  }, [initializePeerConnection, roomId, sendWebRTCAnswer]);

  // Handle incoming answer
  const handleAnswer = useCallback(async (answer) => {
    try {
      const peerConnection = peerConnectionRef.current;
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
      setCallError('Failed to establish connection');
    }
  }, []);

  // Handle incoming ICE candidate
  const handleICECandidate = useCallback(async (candidate) => {
    try {
      const peerConnection = peerConnectionRef.current;
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
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
