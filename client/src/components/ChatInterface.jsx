import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiVideo, FiPhone, FiPaperclip, FiSmile } from 'react-icons/fi';
import { useSocket } from '../context/SocketContext';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ChatInterface = ({ receiverId, receiverName, receiverRole, appointmentId = null, onStartCall }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { user } = useAuth();
  const { 
    socket, 
    joinChat, 
    sendMessage, 
    markMessagesAsRead, 
    startTyping, 
    stopTyping,
    initiateCall 
  } = useSocket();

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
    if (receiverId) {
      joinChat(receiverId);
    }
  }, [receiverId]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (
        (message.sender._id === receiverId && message.receiver._id === user._id) ||
        (message.sender._id === user._id && message.receiver._id === receiverId)
      ) {
        setMessages(prev => [...prev, message]);
        
        // Mark as read if message is from the other user
        if (message.sender._id === receiverId) {
          markMessagesAsRead(receiverId);
        }
      }
    };

    const handleUserTyping = (data) => {
      if (data.userId === receiverId) {
        setIsTyping(true);
        // Clear typing after 3 seconds
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.userId === receiverId) {
        setIsTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [socket, receiverId, user._id, markMessagesAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getMessages(receiverId);
      setMessages(response.data.data.messages);
    } catch (error) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    // Send via socket for real-time delivery
    sendMessage(receiverId, newMessage.trim(), 'text', appointmentId);
    
    // Clear input
    setNewMessage('');
    
    // Stop typing indicator
    stopTyping(receiverId);
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicator
    if (e.target.value.trim()) {
      startTyping(receiverId);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(receiverId);
      }, 1000);
    } else {
      stopTyping(receiverId);
    }
  };

  const handleStartCall = (callType) => {
    if (onStartCall) {
      onStartCall(receiverId, callType, appointmentId);
    } else {
      initiateCall(receiverId, callType, appointmentId);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-600 font-semibold text-sm sm:text-base">
              {receiverName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{receiverName}</h3>
            <p className="text-xs sm:text-sm text-gray-500 capitalize truncate">{receiverRole}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button
            onClick={() => handleStartCall('audio')}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
            title="Start audio call"
          >
            <FiPhone size={16} className="sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => handleStartCall('video')}
            className="p-1.5 sm:p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
            title="Start video call"
          >
            <FiVideo size={16} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
            {error}
          </div>
        )}

        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                {formatDate(dateMessages[0].createdAt)}
              </div>
            </div>

            {/* Messages for this date */}
            {dateMessages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${
                    message.sender._id === user._id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender._id === user._id ? 'text-primary-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-2 sm:p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            type="button"
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors hidden sm:block"
          >
            <FiPaperclip size={18} className="sm:w-5 sm:h-5" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="button"
              className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors hidden sm:block"
            >
              <FiSmile size={16} className="sm:w-4 sm:h-4" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-1.5 sm:p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiSend size={16} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
