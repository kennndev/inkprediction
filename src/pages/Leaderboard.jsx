import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/leaderboard`);
      setLeaderboard(response.data.leaderboard || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-16 h-16 mb-4" />
          <div className="text-xl text-gray-400">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-display font-display font-bold text-gradient-cyber mb-4">
            Leaderboard 🏆
          </h1>
          <p className="text-xl text-gray-300">
            Top predictors on InkPredict
          </p>
        </motion.div>

        {leaderboard.length > 0 ? (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry.address}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="card flex items-center justify-between"
              >
                <div className="flex items-center space-x-6">
                  <div className={`text-4xl ${entry.rank === 1 ? 'text-yellow-400' :
                      entry.rank === 2 ? 'text-gray-300' :
                        entry.rank === 3 ? 'text-orange-600' : ''
                    }`}>
                    #{entry.rank}
                  </div>
                  <div>
                    <div className="font-mono font-bold text-lg">
                      {entry.address}
                    </div>
                    <div className="text-sm text-gray-400">
                      {entry.wins} wins • {entry.volume} USDC volume
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gradient-pink">
                    {entry.winRate}%
                  </div>
                  <div className="text-sm text-gray-400">Win Rate</div>
                </div>
              </motion.div>
            ))}
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
            <p className="text-sm text-gray-500">
              Rankings will appear once markets are resolved and winners are determined.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Leaderboard;
