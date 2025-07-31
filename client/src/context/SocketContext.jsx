import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  const { user, token, isAuthenticated, isLoading } = useAuth();

  // Define removeNotification first since addNotification depends on it
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Define addNotification with useCallback to avoid dependency issues
  const addNotification = useCallback((notification) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep only 10 notifications
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  }, [removeNotification]);

  useEffect(() => {
    // Only connect when authentication is complete and we have user data
    if (isAuthenticated && token && user && !isLoading) {
      console.log('Initializing socket connection for user:', user.name);

      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
        upgrade: true
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🔴 Socket connection error:', error);
        setIsConnected(false);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('🔴 Socket reconnection failed:', error);
      });

      // Handle user status changes
      newSocket.on('user_status_changed', (data) => {
        setOnlineUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          if (data.status === 'online') {
            return [...filtered, data];
          }
          return filtered;
        });
      });

      // Handle incoming messages
      newSocket.on('new_message', (message) => {
        setMessages(prev => [...prev, message]);
        
        // Add notification if message is not from current user
        if (message.sender._id !== user._id) {
          addNotification({
            type: 'message',
            title: 'New Message',
            message: `${message.sender.name}: ${message.message.substring(0, 50)}...`,
            timestamp: new Date(),
            data: message
          });
        }
      });

      // Handle message notifications
      newSocket.on('message_notification', (notification) => {
        if (notification.senderId !== user._id) {
          addNotification({
            type: 'message',
            title: 'New Message',
            message: `${notification.senderName}: ${notification.message}`,
            timestamp: notification.timestamp,
            data: notification
          });
        }
      });

      // Handle incoming calls
      newSocket.on('incoming_call', (callData) => {
        console.log('📞 Incoming call received:', callData);
        setIncomingCall(callData);
        addNotification({
          type: 'call',
          title: 'Incoming Call',
          message: `${callData.caller.name} is calling you`,
          timestamp: new Date(),
          data: callData
        });
      });

      // Handle call initiated (for outgoing calls)
      newSocket.on('call_initiated', (callData) => {
        console.log('📞 Call initiated successfully:', callData);
        setActiveCall(callData);
      });

      // Handle call events
      newSocket.on('call_answered', (data) => {
        setActiveCall(prev => prev ? { ...prev, status: 'answered' } : null);
      });

      newSocket.on('call_rejected', (data) => {
        setIncomingCall(null);
        setActiveCall(null);
        addNotification({
          type: 'call',
          title: 'Call Rejected',
          message: 'Your call was rejected',
          timestamp: new Date()
        });
      });

      newSocket.on('call_ended', (data) => {
        setIncomingCall(null);
        setActiveCall(null);
        addNotification({
          type: 'call',
          title: 'Call Ended',
          message: 'Call has ended',
          timestamp: new Date()
        });
      });

      newSocket.on('call_failed', (data) => {
        setActiveCall(null);
        addNotification({
          type: 'error',
          title: 'Call Failed',
          message: data.reason || 'Call could not be completed',
          timestamp: new Date()
        });
      });

      // Handle typing indicators
      newSocket.on('user_typing', (data) => {
        // Handle typing indicator
        console.log(`${data.userName} is typing...`);
      });

      newSocket.on('user_stopped_typing', (data) => {
        // Handle stop typing
        console.log(`User stopped typing`);
      });

      // Handle helpline messages
      newSocket.on('new_helpline_message', (message) => {
        addNotification({
          type: 'helpline',
          title: 'Helpline Response',
          message: 'You have a new response from support',
          timestamp: new Date(),
          data: message
        });
      });

      // Handle WebRTC signaling events
      newSocket.on('webrtc_offer', (data) => {
        console.log('🔄 Received WebRTC offer:', data);
      });

      newSocket.on('webrtc_answer', (data) => {
        console.log('🔄 Received WebRTC answer:', data);
      });

      newSocket.on('webrtc_ice_candidate', (data) => {
        console.log('🔄 Received ICE candidate:', data);
      });

      // Handle connection errors
      newSocket.on('call_error', (data) => {
        console.error('❌ Call error:', data);
        addNotification({
          type: 'error',
          title: 'Call Error',
          message: data.error || 'An error occurred during the call',
          timestamp: new Date()
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, token, user, isLoading, addNotification]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Socket utility functions
  const joinChat = (receiverId) => {
    if (socket) {
      socket.emit('join_chat', { receiverId });
    }
  };

  const sendMessage = (receiverId, message, messageType = 'text', appointmentId = null) => {
    if (socket) {
      socket.emit('send_message', {
        receiverId,
        message,
        messageType,
        appointmentId
      });
    }
  };

  const markMessagesAsRead = (senderId) => {
    if (socket) {
      socket.emit('mark_messages_read', { senderId });
    }
  };

  const initiateCall = (receiverId, callType, appointmentId = null) => {
    if (socket) {
      socket.emit('initiate_call', {
        receiverId,
        callType,
        appointmentId
      });
    }
  };

  const answerCall = (callId, roomId) => {
    if (socket) {
      socket.emit('answer_call', { callId, roomId });
      setActiveCall({ callId, roomId, status: 'answered' });
      setIncomingCall(null);
    }
  };

  const rejectCall = (callId, roomId) => {
    if (socket) {
      socket.emit('reject_call', { callId, roomId });
      setIncomingCall(null);
    }
  };

  const endCall = (callId, roomId) => {
    if (socket) {
      socket.emit('end_call', { callId, roomId });
      setActiveCall(null);
    }
  };

  const startTyping = (receiverId) => {
    if (socket) {
      socket.emit('typing_start', { receiverId });
    }
  };

  const stopTyping = (receiverId) => {
    if (socket) {
      socket.emit('typing_stop', { receiverId });
    }
  };

  const joinHelpline = () => {
    if (socket) {
      socket.emit('join_helpline');
    }
  };

  const sendHelplineMessage = (message, ticketId) => {
    if (socket) {
      socket.emit('helpline_message', { message, ticketId });
    }
  };

  // WebRTC signaling functions
  const sendWebRTCOffer = (roomId, offer) => {
    if (socket) {
      socket.emit('webrtc_offer', { roomId, offer });
    }
  };

  const sendWebRTCAnswer = (roomId, answer) => {
    if (socket) {
      socket.emit('webrtc_answer', { roomId, answer });
    }
  };

  const sendICECandidate = (roomId, candidate) => {
    if (socket) {
      socket.emit('webrtc_ice_candidate', { roomId, candidate });
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    incomingCall,
    activeCall,
    messages,
    notifications,
    
    // Utility functions
    addNotification,
    removeNotification,
    clearAllNotifications,
    
    // Chat functions
    joinChat,
    sendMessage,
    markMessagesAsRead,
    startTyping,
    stopTyping,
    
    // Call functions
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    
    // Helpline functions
    joinHelpline,
    sendHelplineMessage,
    
    // WebRTC functions
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendICECandidate,
    
    // State setters
    setActiveCall,
    setIncomingCall,
    setMessages
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
