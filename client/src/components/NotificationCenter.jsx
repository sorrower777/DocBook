import React, { useState } from 'react';
import { FiPhone, FiPhoneOff, FiMessageCircle, FiX, FiBell, FiAlertCircle } from 'react-icons/fi';
import { useSocket } from '../context/SocketContext';
import VideoCall from './VideoCall';

const NotificationCenter = () => {
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  
  const {
    incomingCall,
    notifications,
    answerCall,
    rejectCall,
    removeNotification,
    clearAllNotifications
  } = useSocket();

  const handleAnswerCall = () => {
    if (incomingCall) {
      answerCall(incomingCall.callId, incomingCall.roomId);
      setCurrentCall(incomingCall);
      setShowVideoCall(true);
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      rejectCall(incomingCall.callId, incomingCall.roomId);
    }
  };

  const handleEndCall = () => {
    setShowVideoCall(false);
    setCurrentCall(null);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'call':
        return <FiPhone className="text-blue-600" size={20} />;
      case 'message':
        return <FiMessageCircle className="text-green-600" size={20} />;
      case 'helpline':
        return <FiBell className="text-purple-600" size={20} />;
      case 'error':
        return <FiAlertCircle className="text-red-600" size={20} />;
      default:
        return <FiBell className="text-gray-600" size={20} />;
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return time.toLocaleDateString();
  };

  return (
    <>
      {/* Incoming Call Modal */}
      {incomingCall && !showVideoCall && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-semibold text-primary-600">
                  {incomingCall.caller.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Incoming {incomingCall.callType} call
              </h3>
              <p className="text-gray-600">
                {incomingCall.caller.name} ({incomingCall.caller.role})
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleRejectCall}
                className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                <FiPhoneOff size={24} />
              </button>
              <button
                onClick={handleAnswerCall}
                className="p-4 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
              >
                <FiPhone size={24} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              {incomingCall.callType === 'video' ? 'Video call' : 'Audio call'}
            </p>
          </div>
        </div>
      )}

      {/* Video Call Interface */}
      {showVideoCall && currentCall && (
        <VideoCall
          callData={currentCall}
          onEndCall={handleEndCall}
          isIncoming={true}
        />
      )}

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-40 w-80 max-h-96 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {notifications.length} new
                </span>
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Badges */}
      {notifications.length > 0 && (
        <div className="fixed bottom-4 right-4 z-30">
          <div className="bg-primary-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
            <FiBell size={20} />
            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationCenter;
