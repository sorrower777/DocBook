import React, { useState, useEffect } from 'react';
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhone, FiPhoneOff, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import useWebRTC from '../hooks/useWebRTC';
import { useSocket } from '../context/SocketContext';

const VideoCall = ({ callData, onEndCall, isIncoming = false }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);

  const { endCall: socketEndCall } = useSocket();
  
  const {
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
    toggleAudio
  } = useWebRTC(callData?.roomId, !isIncoming);

  // Timer for call duration
  useEffect(() => {
    let interval;
    if (isCallActive && callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive, callStartTime]);

  // Start call when component mounts (for outgoing calls)
  useEffect(() => {
    if (!isIncoming && callData) {
      startCall(callData.callType === 'video', true);
      setCallStartTime(Date.now());
    }
  }, [isIncoming, callData, startCall]);

  // Handle incoming call answer
  const handleAnswerCall = () => {
    answerCall(callData.callType === 'video', true);
    setCallStartTime(Date.now());
  };

  // Handle call end
  const handleEndCall = () => {
    endCall();
    socketEndCall(callData?.callId, callData?.roomId);
    onEndCall();
  };

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (callError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Call Error</h3>
          <p className="text-gray-600 mb-4">{callError}</p>
          <button
            onClick={onEndCall}
            className="w-full btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black z-50 ${isFullscreen ? '' : 'p-1 sm:p-4'}`}>
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-2 sm:p-4">
          <div className="flex justify-between items-center text-white">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold truncate">
                {isIncoming ? `Call from ${callData?.caller?.name}` : `Calling ${callData?.receiver?.name || 'Doctor'}`}
              </h3>
              <p className="text-xs sm:text-sm opacity-75">
                {isCallActive ? formatDuration(callDuration) : connectionState}
              </p>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors flex-shrink-0 hidden sm:block"
            >
              {isFullscreen ? <FiMinimize2 size={18} className="sm:w-5 sm:h-5" /> : <FiMaximize2 size={18} className="sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="flex-1 relative">
          {/* Remote Video (Main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* Remote Video Placeholder */}
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-semibold">
                    {callData?.caller?.name?.charAt(0) || callData?.receiver?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <p className="text-lg">
                  {isIncoming ? 'Connecting...' : 'Waiting for response...'}
                </p>
              </div>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          {callData?.callType === 'video' && (
            <div className="absolute top-16 sm:top-20 right-2 sm:right-4 w-24 sm:w-32 h-18 sm:h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <FiVideoOff className="text-white" size={20} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3 sm:p-6">
          <div className="flex justify-center items-center space-x-3 sm:space-x-6">
            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`p-3 sm:p-4 rounded-full transition-colors ${
                isAudioEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isAudioEnabled ? <FiMic size={20} className="sm:w-6 sm:h-6" /> : <FiMicOff size={20} className="sm:w-6 sm:h-6" />}
            </button>

            {/* Video Toggle (only for video calls) */}
            {callData?.callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${
                  isVideoEnabled 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isVideoEnabled ? <FiVideo size={24} /> : <FiVideoOff size={24} />}
              </button>
            )}

            {/* Answer Call (for incoming calls) */}
            {isIncoming && !isCallActive && (
              <button
                onClick={handleAnswerCall}
                className="p-4 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                <FiPhone size={24} />
              </button>
            )}

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              <FiPhoneOff size={24} />
            </button>
          </div>

          {/* Call Status */}
          <div className="text-center mt-4">
            <p className="text-white text-sm opacity-75">
              {!isCallActive && isIncoming && 'Incoming call'}
              {!isCallActive && !isIncoming && 'Calling...'}
              {isCallActive && `Connected • ${formatDuration(callDuration)}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
