import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Chip, Spinner } from '@heroui/react';
import { Bell, CheckCheck, Clock, ArrowLeft } from 'lucide-react';
import { notificationApiServices } from '../../services/NotificationApi';

const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const summaryRes = await notificationApiServices.getNotificationSummary();
      if (summaryRes.data && summaryRes.data.succeeded) {
        setUnreadCount(summaryRes.data.data.unreadCount || summaryRes.data.data.UnreadCount || 0);
      }

      const notifRes = await notificationApiServices.getNotifications();
      if (notifRes.data && notifRes.data.succeeded) {
        setNotifications(notifRes.data.data.data || notifRes.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      // Optimistic update for immediate visual feedback
      setNotifications(prev => prev.map(n => 
        (n.id === id || n.Id === id) ? { ...n, isRead: true, IsRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));

      const res = await notificationApiServices.markNotificationAsRead(id);
      if (res.data.succeeded) {
        fetchNotifications(false); // Fetch in background without spinner
        window.dispatchEvent(new Event('notificationsRead'));
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
      fetchNotifications(false); // Revert optimistic update on failure
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, IsRead: true })));
      setUnreadCount(0);

      const res = await notificationApiServices.markAllNotificationsAsRead();
      if (res.data.succeeded) {
        fetchNotifications(false); // Fetch in background without spinner
        window.dispatchEvent(new Event('notificationsRead'));
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      fetchNotifications(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <Button 
        variant="light" 
        onPress={() => navigate('/admin/dashboard')}
        className="mb-6 -ml-2 text-gray-500 hover:text-gray-900"
        startContent={<ArrowLeft className="w-4 h-4" />}
      >
        Back to Dashboard
      </Button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" />
            Notifications
            {unreadCount > 0 && (
              <Chip color="danger" variant="flat" size="sm" className="ml-2 font-bold">
                {unreadCount} New
              </Chip>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-2">Stay updated on system alerts and tasks</p>
        </div>
        {notifications.some(n => !n.isRead && !n.IsRead) && (
          <Button 
            color="primary" 
            variant="flat" 
            startContent={<CheckCheck className="w-4 h-4" />}
            onPress={handleMarkAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-4 pb-20">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const isRead = notif.isRead || notif.IsRead;
            const id = notif.id || notif.Id;
            return (
              <Card 
                key={id} 
                className={`border-none shadow-sm transition-all duration-300 ${!isRead ? 'bg-blue-50/50 hover:bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
                isPressable={!isRead}
                onPress={() => !isRead && handleMarkAsRead(id)}
              >
                <CardBody className="p-6">
                  <div className="flex gap-4">
                    <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${!isRead ? 'bg-blue-600' : 'bg-transparent'}`} />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className={`text-lg ${!isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                          {notif.title || notif.Title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimeAgo(notif.createdAt || notif.CreatedAt)}
                        </div>
                      </div>
                      <p className={`text-sm ${!isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                        {notif.message || notif.Message}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">No notifications</h3>
            <p className="text-gray-500 mt-2">You're all caught up! Check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
