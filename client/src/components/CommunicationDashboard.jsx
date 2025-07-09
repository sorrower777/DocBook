import React, { useState, useEffect } from 'react';
import { FiMessageCircle, FiPhone, FiVideo, FiUsers, FiClock, FiX } from 'react-icons/fi';
import ChatInterface from './ChatInterface';
import VideoCall from './VideoCall';
import HelplineSupport from './HelplineSupport';
import { chatAPI, callAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const CommunicationDashboard = ({ isOpen, onClose, initialReceiver = null }) => {
  const [activeTab, setActiveTab] = useState('conversations');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [showHelpline, setShowHelpline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const { initiateCall, onlineUsers } = useSocket();

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      fetchCallHistory();
      
      // If initial receiver is provided, start conversation
      if (initialReceiver) {
        setSelectedConversation(initialReceiver);
        setActiveTab('chat');
      }
    }
  }, [isOpen, initialReceiver]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getConversations();
      setConversations(response.data.data.conversations);
    } catch (error) {
      setError('Failed to load conversations');
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCallHistory = async () => {
    try {
      const response = await callAPI.getCallHistory({ limit: 10 });
      setCallHistory(response.data.data.calls);
    } catch (error) {
      console.error('Error fetching call history:', error);
    }
  };

  const handleStartCall = (receiverId, callType, appointmentId = null) => {
    const callData = {
      receiverId,
      callType,
      appointmentId,
      roomId: `call_${Date.now()}`,
      callId: `call_${Date.now()}`
    };
    
    setCurrentCall(callData);
    setShowVideoCall(true);
    initiateCall(receiverId, callType, appointmentId);
  };

  const handleEndCall = () => {
    setShowVideoCall(false);
    setCurrentCall(null);
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user.userId === userId);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCallStatusColor = (status) => {
    switch (status) {
      case 'answered':
        return 'text-green-600';
      case 'missed':
        return 'text-red-600';
      case 'rejected':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[95vh] sm:h-[85vh] flex flex-col sm:flex-row">
          {/* Sidebar */}
          <div className="w-full sm:w-80 border-b sm:border-b-0 sm:border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Communications</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'conversations'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiMessageCircle className="inline mr-2" size={16} />
                Chats
              </button>
              <button
                onClick={() => setActiveTab('calls')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'calls'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FiPhone className="inline mr-2" size={16} />
                Calls
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'conversations' && (
                <div className="p-4 space-y-2">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                  ) : conversations.length > 0 ? (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.participant._id}
                        onClick={() => {
                          setSelectedConversation(conversation.participant);
                          setActiveTab('chat');
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedConversation?._id === conversation.participant._id
                            ? 'bg-primary-50 border border-primary-200'
                            : 'border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-semibold">
                                {conversation.participant.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {isUserOnline(conversation.participant._id) && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-gray-900 truncate">
                                {conversation.participant.name}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessage.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage.message}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span className="inline-block mt-1 px-2 py-1 text-xs bg-primary-600 text-white rounded-full">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FiMessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No conversations yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'calls' && (
                <div className="p-4 space-y-2">
                  {callHistory.length > 0 ? (
                    callHistory.map((call) => (
                      <div key={call._id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            call.callType === 'video' ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            {call.callType === 'video' ? (
                              <FiVideo className="text-blue-600" size={16} />
                            ) : (
                              <FiPhone className="text-green-600" size={16} />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {call.caller._id === user._id ? call.receiver.name : call.caller.name}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span className={getCallStatusColor(call.status)}>
                                {call.status}
                              </span>
                              <span>•</span>
                              <span>{formatTime(call.createdAt)}</span>
                              {call.duration > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FiClock size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No call history</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowHelpline(true)}
                className="w-full btn-secondary text-sm"
              >
                <FiUsers className="inline mr-2" size={16} />
                Contact Support
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {activeTab === 'chat' && selectedConversation ? (
              <ChatInterface
                receiverId={selectedConversation._id}
                receiverName={selectedConversation.name}
                receiverRole={selectedConversation.role}
                onStartCall={handleStartCall}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FiMessageCircle size={64} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p>Choose a conversation from the sidebar to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Call Modal */}
      {showVideoCall && currentCall && (
        <VideoCall
          callData={currentCall}
          onEndCall={handleEndCall}
          isIncoming={false}
        />
      )}

      {/* Helpline Support Modal */}
      <HelplineSupport
        isOpen={showHelpline}
        onClose={() => setShowHelpline(false)}
      />
    </>
  );
};

export default CommunicationDashboard;
