import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const CommunicationTest = () => {
  const [testMessage, setTestMessage] = useState('');
  const [testResults, setTestResults] = useState([]);
  
  const { 
    socket, 
    isConnected, 
    sendMessage, 
    joinChat,
    initiateCall,
    sendHelplineMessage,
    notifications 
  } = useSocket();
  
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isConnected) {
      addTestResult('✅ Socket.io connected successfully');
    } else {
      addTestResult('❌ Socket.io connection failed');
    }
  }, [isConnected]);

  const addTestResult = (message) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSocketConnection = () => {
    if (socket) {
      addTestResult('✅ Socket object exists');
      addTestResult(`✅ Connected: ${isConnected}`);
      addTestResult(`✅ User authenticated: ${isAuthenticated}`);
      addTestResult(`✅ User ID: ${user?._id}`);
    } else {
      addTestResult('❌ Socket object not found');
    }
  };

  const testChat = () => {
    if (!isAuthenticated) {
      addTestResult('❌ User not authenticated for chat test');
      return;
    }
    
    // Test with a doctor ID (using first doctor from seed data)
    const testReceiverId = '507f1f77bcf86cd799439011'; // Mock doctor ID
    joinChat(testReceiverId);
    sendMessage(testReceiverId, 'Test message from communication test');
    addTestResult('✅ Chat test message sent');
  };

  const testVideoCall = () => {
    if (!isAuthenticated) {
      addTestResult('❌ User not authenticated for video call test');
      return;
    }
    
    const testReceiverId = '507f1f77bcf86cd799439011'; // Mock doctor ID
    initiateCall(testReceiverId, 'video');
    addTestResult('✅ Video call test initiated');
  };

  const testHelpline = () => {
    sendHelplineMessage('Test helpline message');
    addTestResult('✅ Helpline test message sent');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Communication System Test</h2>
      
      {/* Connection Status */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
        <div className="flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          <span className="text-sm text-gray-600">
            {isAuthenticated ? `Logged in as: ${user?.name}` : 'Not authenticated'}
          </span>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-6 space-y-2">
        <h3 className="text-lg font-semibold mb-2">Test Functions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={testSocketConnection}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Socket Connection
          </button>
          <button
            onClick={testChat}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={!isAuthenticated}
          >
            Test Chat
          </button>
          <button
            onClick={testVideoCall}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            disabled={!isAuthenticated}
          >
            Test Video Call
          </button>
          <button
            onClick={testHelpline}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Test Helpline
          </button>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Custom Message Test */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Custom Message Test</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter test message"
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              if (testMessage.trim()) {
                sendHelplineMessage(testMessage);
                addTestResult(`✅ Custom message sent: ${testMessage}`);
                setTestMessage('');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Recent Notifications ({notifications.length})</h3>
        <div className="max-h-32 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div key={index} className="text-sm p-2 border-b">
                <strong>{notification.title}:</strong> {notification.message}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No notifications</p>
          )}
        </div>
      </div>

      {/* Test Results */}
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Test Results</h3>
        <div className="max-h-64 overflow-y-auto bg-gray-50 p-3 rounded">
          {testResults.length > 0 ? (
            testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {result}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No test results yet. Click a test button to start.</p>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
        <div className="text-sm space-y-1">
          <div><strong>Socket Connected:</strong> {isConnected ? 'Yes' : 'No'}</div>
          <div><strong>User Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
          <div><strong>User ID:</strong> {user?._id || 'Not available'}</div>
          <div><strong>User Role:</strong> {user?.role || 'Not available'}</div>
          <div><strong>Socket Object:</strong> {socket ? 'Available' : 'Not available'}</div>
          <div><strong>Notifications Count:</strong> {notifications.length}</div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationTest;
