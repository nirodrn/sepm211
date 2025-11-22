import React, { useState, useEffect } from 'react';
import { User, LogOut, Bell, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { logoutCurrentUser } from '../../services/authService';
import { formatDate } from '../../utils/formatDate';

const NetworkSpeed = () => {
  const [speed, setSpeed] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    const updateSpeed = () => {
      if (connection) {
        setSpeed(connection.downlink); // Mbps
      }
    };

    if (connection) {
      updateSpeed();
      connection.addEventListener('change', updateSpeed);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (connection) {
        connection.removeEventListener('change', updateSpeed);
      }
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">
        <WifiOff className="w-3 h-3" />
        <span>Offline</span>
      </div>
    );
  }

  if (speed === null) return null;

  let colorClass = 'text-green-600 bg-green-50';
  if (speed < 1) colorClass = 'text-red-600 bg-red-50';
  else if (speed < 5) colorClass = 'text-yellow-600 bg-yellow-50';

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      <Wifi className="w-3 h-3" />
      <span>{speed} Mbps</span>
    </div>
  );
};

const Navbar = () => {
  const { userRole } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutCurrentUser();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.status === 'unread') {
      markAsRead(notification.id);
    }
    // You can add navigation logic here based on notification type
    setShowNotifications(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900">SEPMzonline</h1>
        </div>

        <div className="flex items-center space-x-4">
          <NetworkSpeed />

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${notification.status === 'unread' ? 'bg-blue-50' : ''
                            }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${notification.status === 'unread' ? 'bg-blue-500' : 'bg-gray-300'
                              }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${notification.status === 'unread' ? 'font-medium text-gray-900' : 'text-gray-700'
                                }`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {notifications.length > 10 && (
                  <div className="p-3 border-t border-gray-200 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-gray-500" />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userRole?.name}</p>
                <p className="text-xs text-gray-500">{userRole?.role}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Overlay to close notifications when clicking outside */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;