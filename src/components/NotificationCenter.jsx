import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // In production, this would connect to a WebSocket or polling service
  useEffect(() => {
    // TODO: Connect to real notification service
    // For now, start with empty notifications - no fake data!
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'win': return '🎉';
      case 'achievement': return '🏆';
      case 'streak': return '🔥';
      case 'market': return '📊';
      default: return '📢';
    }
  };

  return (
    <>
      {/* Bell Icon - Only show if there are notifications */}
      {notifications.length > 0 && (
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed top-24 right-6 z-40 p-3 rounded-full glass-strong shadow-lg"
        >
          <div className="relative">
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>
        </motion.button>
      )}

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-36 right-6 z-50 w-80 max-h-96 glass-strong rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
                <h3 className="font-bold">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <span className="text-4xl">🔕</span>
                    <p className="mt-2">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-4 border-b border-purple-500/10 cursor-pointer hover:bg-purple-500/10 transition-colors ${!notification.read ? 'bg-purple-500/5' : ''
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'text-white' : 'text-gray-400'}`}>
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-500">
                            {getTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const getTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default NotificationCenter;
