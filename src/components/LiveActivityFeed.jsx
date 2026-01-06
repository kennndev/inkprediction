import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const LiveActivityFeed = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activities, setActivities] = useState([]);
  const [newActivityCount, setNewActivityCount] = useState(0);

  useEffect(() => {
    // Simulated live feed - in production, use WebSocket
    const mockActivities = [
      { id: 1, type: 'bet', user: '0x1a2b...3c4d', position: true, amount: '50', marketId: '1', timestamp: Date.now() - 30000 },
      { id: 2, type: 'bet', user: '0x5e6f...7g8h', position: false, amount: '100', marketId: '2', timestamp: Date.now() - 60000 },
      { id: 3, type: 'win', user: '0x9i0j...1k2l', amount: '250', marketId: '3', timestamp: Date.now() - 90000 },
      { id: 4, type: 'bet', user: '0x3m4n...5o6p', position: true, amount: '25', marketId: '1', timestamp: Date.now() - 120000 },
      { id: 5, type: 'streak', user: '0x7q8r...9s0t', streak: 5, timestamp: Date.now() - 150000 },
    ];
    setActivities(mockActivities);

    // Simulate new activities
    const interval = setInterval(() => {
      const newActivity = {
        id: Date.now(),
        type: Math.random() > 0.3 ? 'bet' : 'win',
        user: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`,
        position: Math.random() > 0.5,
        amount: (Math.floor(Math.random() * 100) + 10).toString(),
        marketId: Math.floor(Math.random() * 5 + 1).toString(),
        timestamp: Date.now(),
      };

      setActivities(prev => [newActivity, ...prev.slice(0, 9)]);
      if (!isExpanded) {
        setNewActivityCount(prev => prev + 1);
      }
    }, 15000);

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
