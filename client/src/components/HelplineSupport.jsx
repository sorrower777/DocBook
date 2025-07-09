import React, { useState, useEffect } from 'react';
import { FiMessageCircle, FiPhone, FiAlertCircle, FiHelpCircle, FiSend, FiX } from 'react-icons/fi';
import { helplineAPI, callAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const HelplineSupport = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'tickets', 'emergency'
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [quickHelp, setQuickHelp] = useState([]);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'medium'
  });
  const [chatMessage, setChatMessage] = useState('');
  const [helplineMessages, setHelplineMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const { socket, joinHelpline, sendHelplineMessage } = useSocket();

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      if (socket) {
        joinHelpline();
      }
    }
  }, [isOpen, socket]);

  // Listen for helpline messages
  useEffect(() => {
    if (!socket) return;

    const handleHelplineMessage = (message) => {
      setHelplineMessages(prev => [...prev, message]);
    };

    socket.on('new_helpline_message', handleHelplineMessage);

    return () => {
      socket.off('new_helpline_message', handleHelplineMessage);
    };
  }, [socket]);

  const fetchInitialData = async () => {
    try {
      const [categoriesRes, quickHelpRes, ticketsRes] = await Promise.all([
        helplineAPI.getCategories(),
        helplineAPI.getQuickHelp(),
        helplineAPI.getTickets({ limit: 5 })
      ]);

      setCategories(categoriesRes.data.data.categories);
      setQuickHelp(quickHelpRes.data.data.quickHelp);
      setTickets(ticketsRes.data.data.tickets);
    } catch (error) {
      setError('Failed to load helpline data');
      console.error('Error fetching helpline data:', error);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    
    if (!newTicket.subject || !newTicket.description || !newTicket.category) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await helplineAPI.createTicket(newTicket);
      
      setTickets(prev => [response.data.data.ticket, ...prev]);
      setNewTicket({ subject: '', description: '', category: '', priority: 'medium' });
      setError('');
      
      // Switch to tickets tab to show the new ticket
      setActiveTab('tickets');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    
    if (!chatMessage.trim()) return;

    // Send via socket for real-time delivery
    sendHelplineMessage(chatMessage.trim());
    
    // Add to local messages
    setHelplineMessages(prev => [...prev, {
      _id: Date.now().toString(),
      sender: { _id: user._id, name: user.name, role: user.role },
      message: chatMessage.trim(),
      createdAt: new Date().toISOString()
    }]);
    
    setChatMessage('');
  };

  const handleEmergencyCall = async () => {
    try {
      setLoading(true);
      const response = await callAPI.initiateEmergencyCall('Emergency helpline call');
      
      // In a real implementation, this would connect to emergency services
      alert('Emergency call initiated. You will be connected to our emergency helpline shortly.');
      
    } catch (error) {
      setError('Failed to initiate emergency call');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[95vh] sm:h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Helpline Support</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiMessageCircle className="inline mr-2" size={16} />
            Live Chat
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tickets'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiHelpCircle className="inline mr-2" size={16} />
            Support Tickets
          </button>
          <button
            onClick={() => setActiveTab('emergency')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'emergency'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiAlertCircle className="inline mr-2" size={16} />
            Emergency
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Live Chat Tab */}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {helplineMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <FiMessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>Start a conversation with our support team</p>
                    <p className="text-sm">We're here to help 24/7</p>
                  </div>
                ) : (
                  helplineMessages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender._id === user._id
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.sender._id !== user._id && (
                          <p className="text-xs font-medium mb-1">Support Agent</p>
                        )}
                        <p className="text-sm">{message.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender._id === user._id ? 'text-primary-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChatMessage} className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!chatMessage.trim()}
                    className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiSend size={18} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Support Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Create New Ticket */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Create Support Ticket</h3>
                  <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={newTicket.category}
                        onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={newTicket.subject}
                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newTicket.description}
                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={newTicket.priority}
                        onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Ticket'}
                    </button>
                  </form>
                </div>

                {/* Recent Tickets */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Tickets</h3>
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div key={ticket._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              ticket.status === 'open'
                                ? 'bg-green-100 text-green-800'
                                : ticket.status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {ticket.description.substring(0, 100)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Help */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Quick Help</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {quickHelp.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Emergency Tab */}
          {activeTab === 'emergency' && (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <FiAlertCircle size={64} className="mx-auto mb-6 text-red-500" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Medical Emergency
                </h3>
                <p className="text-gray-600 mb-6">
                  If you're experiencing a medical emergency, please call emergency services immediately or use our emergency helpline.
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={handleEmergencyCall}
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <FiPhone className="inline mr-2" size={20} />
                    {loading ? 'Connecting...' : 'Call Emergency Helpline'}
                  </button>
                  
                  <div className="text-sm text-gray-500">
                    <p>Emergency Hotline: <strong>911</strong></p>
                    <p>Poison Control: <strong>1-800-222-1222</strong></p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelplineSupport;
