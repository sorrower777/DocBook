const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Message, Call } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Store active users and their socket connections
const activeUsers = new Map();
const activeCalls = new Map();

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.userRole = user.role;
    socket.userName = user.name;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userName} (${socket.userId})`);
    
    // Store active user
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      userName: socket.userName,
      role: socket.userRole,
      status: 'online',
      lastSeen: new Date()
    });

    // Join user to their personal room
    socket.join(socket.userId);

    // Emit user status to all connected users
    socket.broadcast.emit('user_status_changed', {
      userId: socket.userId,
      userName: socket.userName,
      status: 'online'
    });

    // Handle joining chat rooms
    socket.on('join_chat', (data) => {
      const { receiverId } = data;
      const roomId = [socket.userId, receiverId].sort().join('_');
      socket.join(roomId);
      console.log(`User ${socket.userName} joined chat room: ${roomId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, message, messageType = 'text', appointmentId } = data;
        
        // Create message in database
        const newMessage = new Message({
          sender: socket.userId,
          receiver: receiverId,
          message,
          messageType,
          appointment: appointmentId || null
        });

        await newMessage.save();

        // Prepare message data
        const messageData = {
          _id: newMessage._id,
          sender: {
            _id: socket.userId,
            name: socket.userName,
            role: socket.userRole
          },
          receiver: {
            _id: receiverId
          },
          message,
          messageType,
          createdAt: newMessage.createdAt,
          isRead: false
        };

        // Send to receiver (if online)
        const receiverSocket = activeUsers.get(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket.socketId).emit('new_message', messageData);
        }

        // Send back to sender (confirmation)
        socket.emit('new_message', messageData);

        // Send notification to receiver if they're online
        if (receiverSocket) {
          io.to(receiverSocket.socketId).emit('message_notification', {
            senderId: socket.userId,
            senderName: socket.userName,
            message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            timestamp: new Date()
          });
        }

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle marking messages as read
    socket.on('mark_messages_read', async (data) => {
      try {
        const { senderId } = data;
        await Message.updateMany(
          { sender: senderId, receiver: socket.userId, isRead: false },
          { isRead: true, readAt: new Date() }
        );

        // Notify sender that messages were read
        const senderSocket = activeUsers.get(senderId);
        if (senderSocket) {
          io.to(senderId).emit('messages_read', {
            readBy: socket.userId,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle call initiation
    socket.on('initiate_call', async (data) => {
      try {
        const { receiverId, callType, appointmentId } = data;
        const callId = uuidv4();
        const roomId = `call_${callId}`;

        // Create call record
        const newCall = new Call({
          caller: socket.userId,
          receiver: receiverId,
          callType,
          callId,
          roomId,
          appointment: appointmentId || null,
          status: 'initiated'
        });

        await newCall.save();
        activeCalls.set(callId, newCall);

        // Join call room
        socket.join(roomId);
        console.log(`📞 User ${socket.userName} joined call room: ${roomId}`);

        // Notify receiver about incoming call
        const receiverSocket = activeUsers.get(receiverId);
        if (receiverSocket) {
          // Make receiver join the room too
          io.sockets.sockets.get(receiverSocket.socketId)?.join(roomId);
          
          io.to(receiverId).emit('incoming_call', {
            callId,
            roomId,
            caller: {
              id: socket.userId,
              name: socket.userName,
              role: socket.userRole
            },
            callType,
            appointmentId
          });

          // Also notify the caller with call details
          socket.emit('call_initiated', {
            callId,
            roomId,
            receiver: {
              id: receiverId,
              name: receiverSocket.userName,
              role: receiverSocket.role
            },
            callType,
            appointmentId
          });

          // Update call status to ringing
          await Call.findByIdAndUpdate(newCall._id, { status: 'ringing' });
        } else {
          // Receiver is offline
          socket.emit('call_failed', { reason: 'User is offline' });
          await Call.findByIdAndUpdate(newCall._id, { status: 'missed', endTime: new Date() });
        }

      } catch (error) {
        console.error('Error initiating call:', error);
        socket.emit('call_error', { error: 'Failed to initiate call' });
      }
    });

    // Handle call answer
    socket.on('answer_call', async (data) => {
      try {
        const { callId, roomId } = data;
        
        // Join call room
        socket.join(roomId);

        // Update call status
        await Call.findOneAndUpdate(
          { callId },
          { status: 'answered', startTime: new Date() }
        );

        // Notify caller that call was answered
        socket.to(roomId).emit('call_answered', { callId, roomId });

      } catch (error) {
        console.error('Error answering call:', error);
        socket.emit('call_error', { error: 'Failed to answer call' });
      }
    });

    // Handle call rejection
    socket.on('reject_call', async (data) => {
      try {
        const { callId, roomId } = data;

        // Update call status
        await Call.findOneAndUpdate(
          { callId },
          { status: 'rejected', endTime: new Date() }
        );

        // Notify caller that call was rejected
        socket.to(roomId).emit('call_rejected', { callId });
        
        // Clean up
        activeCalls.delete(callId);

      } catch (error) {
        console.error('Error rejecting call:', error);
      }
    });

    // Handle call end
    socket.on('end_call', async (data) => {
      try {
        const { callId, roomId } = data;

        // Update call status
        await Call.findOneAndUpdate(
          { callId },
          { status: 'ended', endTime: new Date() }
        );

        // Notify all participants that call ended
        io.to(roomId).emit('call_ended', { callId });
        
        // Clean up
        activeCalls.delete(callId);

      } catch (error) {
        console.error('Error ending call:', error);
      }
    });

    // Handle WebRTC signaling
    socket.on('webrtc_offer', (data) => {
      const { roomId, offer } = data;
      console.log(`📡 WebRTC offer from ${socket.userName} to room ${roomId}`);
      socket.to(roomId).emit('webrtc_offer', { offer, senderId: socket.id });
    });

    socket.on('webrtc_answer', (data) => {
      const { roomId, answer } = data;
      console.log(`📡 WebRTC answer from ${socket.userName} to room ${roomId}`);
      socket.to(roomId).emit('webrtc_answer', { answer, senderId: socket.id });
    });

    socket.on('webrtc_ice_candidate', (data) => {
      const { roomId, candidate } = data;
      console.log(`📡 ICE candidate from ${socket.userName} to room ${roomId}`);
      socket.to(roomId).emit('webrtc_ice_candidate', { candidate, senderId: socket.id });
    });

    // Handle helpline chat
    socket.on('join_helpline', () => {
      socket.join('helpline');
      console.log(`User ${socket.userName} joined helpline`);
    });

    socket.on('helpline_message', async (data) => {
      try {
        const { message, ticketId } = data;
        
        // Create helpline message
        const newMessage = new Message({
          sender: socket.userId,
          receiver: null, // Helpline messages don't have specific receiver
          message,
          messageType: 'text',
          isHelplineMessage: true
        });

        await newMessage.save();

        // Broadcast to all helpline agents
        socket.to('helpline').emit('new_helpline_message', {
          _id: newMessage._id,
          sender: {
            _id: socket.userId,
            name: socket.userName,
            role: socket.userRole
          },
          message,
          ticketId,
          createdAt: newMessage.createdAt
        });

      } catch (error) {
        console.error('Error sending helpline message:', error);
        socket.emit('helpline_error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { receiverId } = data;
      const roomId = [socket.userId, receiverId].sort().join('_');
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName
      });
    });

    socket.on('typing_stop', (data) => {
      const { receiverId } = data;
      const roomId = [socket.userId, receiverId].sort().join('_');
      socket.to(roomId).emit('user_stopped_typing', {
        userId: socket.userId
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userName} (${socket.userId})`);
      
      // Update user status
      const user = activeUsers.get(socket.userId);
      if (user) {
        user.status = 'offline';
        user.lastSeen = new Date();
        
        // Notify others about user going offline
        socket.broadcast.emit('user_status_changed', {
          userId: socket.userId,
          userName: socket.userName,
          status: 'offline',
          lastSeen: user.lastSeen
        });
        
        // Remove from active users after a delay (in case of reconnection)
        setTimeout(() => {
          activeUsers.delete(socket.userId);
        }, 30000); // 30 seconds
      }

      // End any active calls
      for (const [callId, call] of activeCalls.entries()) {
        if (call.caller.toString() === socket.userId || call.receiver.toString() === socket.userId) {
          Call.findOneAndUpdate(
            { callId },
            { status: 'ended', endTime: new Date() }
          ).exec();
          
          socket.to(call.roomId).emit('call_ended', { callId, reason: 'User disconnected' });
          activeCalls.delete(callId);
        }
      }
    });
  });

  // Utility function to get active users
  io.getActiveUsers = () => {
    return Array.from(activeUsers.values());
  };

  // Utility function to get active calls
  io.getActiveCalls = () => {
    return Array.from(activeCalls.values());
  };

  return io;
};

module.exports = initializeSocket;
