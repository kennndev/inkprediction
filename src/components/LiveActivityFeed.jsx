import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';

const LiveActivityFeed = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activities, setActivities] = useState([]);
  const [newActivityCount, setNewActivityCount] = useState(0);
  const [lastActivityId, setLastActivityId] = useState(null);

  const fetchRecentActivity = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/activity/recent`);

      if (response.data.success && response.data.activities) {
        const newActivities = response.data.activities;

        // Check for new activities
        if (lastActivityId && newActivities.length > 0) {
          const newCount = newActivities.findIndex(a => a.id === lastActivityId);
          if (newCount > 0 && !isExpanded) {
            setNewActivityCount(prev => prev + newCount);
          }
        }

        if (newActivities.length > 0) {
          setLastActivityId(newActivities[0].id);
        }

        setActivities(newActivities);
      }
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      // Keep existing activities on error
    }
  };

  useEffect(() => {
    // Fetch initial data
    fetchRecentActivity();

    // Poll for new activities every 30 seconds
    const interval = setInterval(fetchRecentActivity, 30000);

    return () => clearInterval(interval);
  }, [isExpanded]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setNewActivityCount(0);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full glass-strong shadow-lg"
      >
        <div className="relative">
          <span className="text-2xl">📡</span>
          {newActivityCount > 0 && !isExpanded && (
            <span className="notification-badge">{newActivityCount}</span>
          )}
        </div>
      </motion.button>

      {/* Feed Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-24 right-6 z-40 w-80 max-h-96 live-feed rounded-xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="live-indicator">
                  <span className="live-dot" />
                  <span>Live</span>
                </div>
              </div>
              <button
                onClick={handleToggle}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Activity List */}
            <div className="max-h-72 overflow-y-auto">
              <AnimatePresence>
                {activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="feed-item"
                  >
                    <ActivityItem activity={activity} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const ActivityItem = ({ activity }) => {
  const timeAgo = getTimeAgo(activity.timestamp);

  if (activity.type === 'bet') {
    return (
      <Link to={`/market/${activity.marketId}`}>
        <div className="flex items-center gap-3 hover:bg-purple-500/10 p-2 rounded-lg transition-colors">
          <span className="text-2xl">{activity.position ? '🟢' : '🔴'}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm">
              <span className="text-gray-400">{activity.user}</span>
              <span className="text-white"> bet </span>
              <span className={activity.position ? 'text-green-400' : 'text-red-400'}>
                {activity.position ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {activity.amount} USDC • {timeAgo}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (activity.type === 'win') {
    return (
      <div className="flex items-center gap-3 p-2">
        <span className="text-2xl">🎉</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            <span className="text-gray-400">{activity.user}</span>
            <span className="text-green-400"> won {activity.amount} USDC!</span>
          </div>
          <div className="text-xs text-gray-500">{timeAgo}</div>
        </div>
      </div>
    );
  }

  if (activity.type === 'streak') {
    return (
      <div className="flex items-center gap-3 p-2">
        <span className="text-2xl">🔥</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            <span className="text-gray-400">{activity.user}</span>
            <span className="text-orange-400"> hit a {activity.streak} win streak!</span>
          </div>
          <div className="text-xs text-gray-500">{timeAgo}</div>
        </div>
      </div>
    );
  }

  return null;
};

const getTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default LiveActivityFeed;
