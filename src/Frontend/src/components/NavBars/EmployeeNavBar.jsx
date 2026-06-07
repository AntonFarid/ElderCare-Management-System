// src/components/NavBars/EmployeeNavbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, LogOut, HeartHandshake } from 'lucide-react';
import TasksDropdown from '../employee/TasksDropdown';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export default function EmployeeNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { setUserToken } = useContext(AuthContext);

    const navigationItems = [
        { name: 'Dashboard', path: '/employee/dashboard' },
        { name: 'My Residents', path: '/employee/residents' },
        { name: 'Daily Reports', path: '/employee/dailyreports' },
        { name: 'Schedule', path: '/employee/schedule' },
        { name: 'Tasks', path: '/employee/tasks' },
        { name: 'Profile', path: '/employee/profile' },
    ];

    const isActive = (path) => location.pathname === path;

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // We'll import notificationApiServices dynamically to avoid circular dependencies
                const { notificationApiServices } = await import('../../services/NotificationApi');
                const res = await notificationApiServices.getNotificationSummary();
                if (res.data?.succeeded) {
                    setUnreadCount(res.data.data.unreadCount || res.data.data.UnreadCount || 0);
                }
            } catch (error) {
                console.error("Failed to fetch notification summary", error);
            }
        };
        fetchNotifications();

        window.addEventListener('notificationsRead', fetchNotifications);
        return () => window.removeEventListener('notificationsRead', fetchNotifications);
    }, []);

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
                    <Link to="/employee/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                            <HeartHandshake className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-gray-900">SilverNest</span>
                            <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Employee Portal</span>
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
                        <button 
                            onClick={() => navigate('/employee/notifications')}
                            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                            )}
                        </button>

                        {/* Tasks Dropdown */}
                        <TasksDropdown />

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
                        <button 
                            onClick={() => navigate('/employee/notifications')}
                            className="relative p-2 text-gray-600"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                            )}
                        </button>
                        {/* Tasks Dropdown (mobile) */}
                        <TasksDropdown />
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
                                        ? 'bg-green-50 text-green-600'
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