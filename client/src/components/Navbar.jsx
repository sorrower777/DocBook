import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMessageCircle, FiPhone, FiHelpCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import CommunicationDashboard from './CommunicationDashboard';
import HelplineSupport from './HelplineSupport';

const Navbar = () => {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { isConnected, notifications } = useSocket();
  const navigate = useNavigate();

  const [showCommunications, setShowCommunications] = useState(false);
  const [showHelpline, setShowHelpline] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-xl font-bold text-gray-900">DocBook</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              Find Doctors
            </Link>
            
            {isAuthenticated ? (
              <>
                {/* Authenticated User Links */}
                <Link
                  to={user?.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard'}
                  className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                >
                  Dashboard
                </Link>

                {/* Communication Features */}
                <div className="flex items-center space-x-2">
                  {/* Messages */}
                  <button
                    onClick={() => setShowCommunications(true)}
                    className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    title="Messages & Calls"
                  >
                    <FiMessageCircle size={20} />
                    {notifications.filter(n => n.type === 'message').length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {notifications.filter(n => n.type === 'message').length}
                      </span>
                    )}
                  </button>

                  {/* Helpline */}
                  <button
                    onClick={() => setShowHelpline(true)}
                    className="p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                    title="Help & Support"
                  >
                    <FiHelpCircle size={20} />
                  </button>

                  {/* Connection Status */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isLoading ? 'bg-yellow-500 animate-pulse' :
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-gray-500">
                      {isLoading ? 'Connecting...' : isConnected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">
                    Welcome, {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Guest Links */}
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn-primary"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-700 hover:text-primary-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Communication Dashboard */}
      <CommunicationDashboard
        isOpen={showCommunications}
        onClose={() => setShowCommunications(false)}
      />

      {/* Helpline Support */}
      <HelplineSupport
        isOpen={showHelpline}
        onClose={() => setShowHelpline(false)}
      />
    </nav>
  );
};

export default Navbar;
