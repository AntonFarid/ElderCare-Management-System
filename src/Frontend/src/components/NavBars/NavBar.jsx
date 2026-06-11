// src/components/NavBars/FamilyNavbar.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, LogOut, HeartHandshake } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import { familyApiServices } from '../../services/Family/FamilyApi';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { setUserToken } = useContext(AuthContext);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();

    window.addEventListener('notificationsRead', fetchUnreadCount);
    return () => window.removeEventListener('notificationsRead', fetchUnreadCount);
  }, [location.pathname]); // re-fetch when navigating (e.g. after marking as read on the Notifications page)

  const fetchUnreadCount = async () => {
    try {
      const summaryRes = await familyApiServices.getNotificationSummary();
      if (summaryRes.data && summaryRes.data.succeeded) {
        setUnreadCount(summaryRes.data.data.totalUnread || summaryRes.data.data.TotalUnread || summaryRes.data.data.unreadCount || summaryRes.data.data.UnreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notification summary:", error);
    }
  };

  const navigationItems = [
    { name: 'Home', path: '/family/home' },
    { name: 'My Loved Ones', path: '/family/loved-ones' },
    { name: 'Visits', path: '/family/visits' },
    { name: 'Reports', path: '/family/dailyupdates' },
    { name: 'Profile', path: '/family/profile' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserToken(null);
    navigate('/signin');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link to="/family/home" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-md">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">Sanad</span>
              <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Family Portal</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${active
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Notification Bell */}
            <Link to="/family/notifications" className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link to="/family/notifications" className="relative p-2 text-gray-600">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-1">
            {navigationItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors ${active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}