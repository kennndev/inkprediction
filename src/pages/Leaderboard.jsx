import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import axios from 'axios';

const Leaderboard = () => {
  const { address, isConnected } = useAccount();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/leaderboard?timeframe=${timeframe}`);
      setLeaderboard(response.data.leaderboard || []);
      
      // Find current user's rank
      if (isConnected && address) {
        const rank = response.data.leaderboard?.findIndex(
          (e) => e.address?.toLowerCase() === address.toLowerCase()
        );
        setUserRank(rank >= 0 ? rank + 1 : null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { emoji: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-400/20' };
    if (rank === 2) return { emoji: '🥈', color: 'text-gray-300', bg: 'bg-gray-300/20' };
    if (rank === 3) return { emoji: '🥉', color: 'text-orange-400', bg: 'bg-orange-400/20' };
    return { emoji: null, color: 'text-gray-400', bg: '' };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-display font-display font-bold text-gradient-cyber mb-4">
            Leaderboard 🏆
          </h1>
          <p className="text-xl text-gray-300">
            Top predictors on Boink Prediction
          </p>
        </motion.div>

        {/* Your Rank Card */}
        {isConnected && userRank && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="card mb-8 border-2 border-purple-500/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="level-badge-large">#{userRank}</div>
                <div>
                  <div className="text-lg font-bold text-gradient-purple">Your Rank</div>
                  <div className="text-sm text-gray-400">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                </div>
              </div>
              <Link to={`/profile/${address}`}>
                <button className="btn-primary">View Profile</button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Timeframe Filter */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-3 mb-8"
        >
          {['all', 'weekly', 'monthly'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`filter-btn ${timeframe === tf ? 'active' : ''}`}
            >
              {tf === 'all' && '🏆 All Time'}
              {tf === 'weekly' && '📅 This Week'}
              {tf === 'monthly' && '📆 This Month'}
            </button>
          ))}
        </motion.div>

        {/* Leaderboard */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card">
                <div className="skeleton h-16 w-full" />
              </div>
            ))}
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const rank = entry.rank || index + 1;
              const { emoji, color, bg } = getRankBadge(rank);
              const isCurrentUser = isConnected && entry.address?.toLowerCase() === address?.toLowerCase();

              return (
                <motion.div
                  key={entry.address}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`card flex items-center justify-between ${
                    isCurrentUser ? 'border-2 border-purple-500/50' : ''
                  } ${bg}`}
                >
                  <div className="flex items-center gap-6">
                    {/* Rank */}
                    <div className={`text-3xl font-bold ${color} w-12 text-center`}>
                      {emoji || `#${rank}`}
                    </div>

                    {/* User Info */}
                    <Link to={`/profile/${entry.address}`} className="hover:text-purple-400 transition-colors">
                      <div className="font-mono font-bold text-lg">
                        {entry.address?.slice(0, 6)}...{entry.address?.slice(-4)}
                        {isCurrentUser && <span className="ml-2 text-purple-400">(You)</span>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>🏆 {entry.wins} wins</span>
                        <span>💰 {entry.volume} USDC</span>
                        <span>🔥 {entry.streak || 0} streak</span>
                      </div>
                    </Link>
                  </div>

                  {/* Win Rate */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gradient-gold">
                      {entry.winRate}%
                    </div>
                    <div className="text-sm text-gray-400">Win Rate</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-gradient-cyber mb-4">
              No Rankings Yet
            </h2>
            <p className="text-gray-400 text-lg mb-4">
              Be the first to make predictions and climb the leaderboard!
            </p>
            <Link to="/">
              <button className="btn-primary">Start Predicting</button>
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Leaderboard;
