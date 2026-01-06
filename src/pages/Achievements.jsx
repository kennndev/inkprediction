import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import axios from 'axios';

const ACHIEVEMENTS = [
  // Betting Milestones
  { id: 'first_bet', name: 'First Steps', description: 'Place your first bet', icon: '🎯', xp: 50, category: 'betting' },
  { id: 'bet_10', name: 'Getting Started', description: 'Place 10 bets', icon: '🔟', xp: 100, category: 'betting' },
  { id: 'bet_50', name: 'Regular Predictor', description: 'Place 50 bets', icon: '5️⃣', xp: 250, category: 'betting' },
  { id: 'bet_100', name: 'Prediction Master', description: 'Place 100 bets', icon: '💯', xp: 500, category: 'betting' },
  { id: 'bet_500', name: 'Legendary Bettor', description: 'Place 500 bets', icon: '🏆', xp: 1000, category: 'betting' },

  // Winning Achievements
  { id: 'first_win', name: 'Winner Winner', description: 'Win your first bet', icon: '🎉', xp: 75, category: 'winning' },
  { id: 'win_10', name: 'Lucky Streak', description: 'Win 10 bets', icon: '🍀', xp: 200, category: 'winning' },
  { id: 'win_50', name: 'Fortune Teller', description: 'Win 50 bets', icon: '🔮', xp: 500, category: 'winning' },
  { id: 'win_rate_60', name: 'Sharp Mind', description: 'Achieve 60% win rate (min 20 bets)', icon: '🧠', xp: 300, category: 'winning' },
  { id: 'win_rate_70', name: 'Oracle', description: 'Achieve 70% win rate (min 30 bets)', icon: '👁️', xp: 600, category: 'winning' },

  // Streak Achievements
  { id: 'streak_3', name: 'Hot Streak', description: 'Win 3 bets in a row', icon: '🔥', xp: 150, category: 'streak' },
  { id: 'streak_5', name: 'On Fire', description: 'Win 5 bets in a row', icon: '🌟', xp: 300, category: 'streak' },
  { id: 'streak_10', name: 'Unstoppable', description: 'Win 10 bets in a row', icon: '💫', xp: 750, category: 'streak' },

  // Volume Achievements
  { id: 'volume_100', name: 'Small Spender', description: 'Bet 100 USDC total', icon: '💵', xp: 100, category: 'volume' },
  { id: 'volume_1000', name: 'High Roller', description: 'Bet 1,000 USDC total', icon: '💰', xp: 400, category: 'volume' },
  { id: 'volume_10000', name: 'Whale', description: 'Bet 10,000 USDC total', icon: '🐋', xp: 1500, category: 'volume' },

  // Special Achievements
  { id: 'early_bird', name: 'Early Bird', description: 'Bet within 1 hour of market creation', icon: '🐦', xp: 100, category: 'special' },
  { id: 'night_owl', name: 'Night Owl', description: 'Place a bet between 12am-5am', icon: '🦉', xp: 75, category: 'special' },
  { id: 'big_win', name: 'Jackpot', description: 'Win 500+ USDC in a single bet', icon: '💎', xp: 500, category: 'special' },
  { id: 'underdog', name: 'Underdog', description: 'Win a bet at 20% or lower odds', icon: '🐕', xp: 400, category: 'special' },
  { id: 'daily_7', name: 'Dedicated', description: 'Log in 7 days in a row', icon: '📅', xp: 200, category: 'special' },
  { id: 'daily_30', name: 'Committed', description: 'Log in 30 days in a row', icon: '🗓️', xp: 750, category: 'special' },

  // Social Achievements
  { id: 'share_first', name: 'Influencer', description: 'Share a market on social media', icon: '📢', xp: 50, category: 'social' },
  { id: 'comment_10', name: 'Chatterbox', description: 'Leave 10 comments', icon: '💬', xp: 100, category: 'social' },
  { id: 'top_10', name: 'Elite', description: 'Reach top 10 on leaderboard', icon: '🥇', xp: 1000, category: 'social' },
];

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '📋' },
  { id: 'betting', name: 'Betting', icon: '🎯' },
  { id: 'winning', name: 'Winning', icon: '🏆' },
  { id: 'streak', name: 'Streaks', icon: '🔥' },
  { id: 'volume', name: 'Volume', icon: '💰' },
  { id: 'special', name: 'Special', icon: '⭐' },
  { id: 'social', name: 'Social', icon: '👥' },
];

const Achievements = () => {
  const { address, isConnected } = useAccount();
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    if (isConnected && address) {
      fetchAchievements();
      fetchUserStats();
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  const fetchAchievements = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/user/${address}/achievements`);
      setUserAchievements(response.data.achievements || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/user/${address}/stats`);
      setUserStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const filteredAchievements = ACHIEVEMENTS.filter(
    a => selectedCategory === 'all' || a.category === selectedCategory
  );

  const unlockedCount = ACHIEVEMENTS.filter(a => 
    userAchievements.includes(a.id)
  ).length;

  const totalXP = ACHIEVEMENTS
    .filter(a => userAchievements.includes(a.id))
    .reduce((sum, a) => sum + a.xp, 0);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-4">🏅</div>
          <h2 className="text-3xl font-bold text-gradient-cyber mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 text-lg">
            Connect your wallet to view your achievements
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-display font-display font-bold text-gradient-cyber mb-4">
            Achievements 🏅
          </h1>
          <p className="text-xl text-gray-300">
            Complete challenges to earn XP and unlock badges
          </p>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="card text-center">
            <div className="text-4xl mb-2">🎖️</div>
            <div className="text-3xl font-bold text-gradient-gold">{unlockedCount}</div>
            <div className="text-gray-400">/ {ACHIEVEMENTS.length} Unlocked</div>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-3xl font-bold text-gradient-purple">{totalXP}</div>
            <div className="text-gray-400">Total XP Earned</div>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-3xl font-bold text-gradient-fire">{userStats?.streak || 0}</div>
            <div className="text-gray-400">Current Streak</div>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-3xl font-bold text-green-400">{userStats?.winRate || 0}%</div>
            <div className="text-gray-400">Win Rate</div>
          </div>
        </motion.div>

        {/* Overall Progress Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card mb-8"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Achievement Progress</span>
            <span className="text-gradient-gold font-bold">
              {Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%
            </span>
          </div>
          <div className="xp-bar">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="xp-fill"
            />
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </motion.div>

        {/* Achievements Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card">
                <div className="skeleton h-32 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement, index) => {
              const isUnlocked = userAchievements.includes(achievement.id);
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`achievement-card ${isUnlocked ? 'unlocked' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`text-5xl ${!isUnlocked ? 'grayscale opacity-50' : ''}`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold text-lg ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                          {achievement.name}
                        </h3>
                        {isUnlocked && (
                          <span className="badge badge-gold text-xs">Unlocked</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-mono ${isUnlocked ? 'text-gradient-gold' : 'text-gray-500'}`}>
                          +{achievement.xp} XP
                        </span>
                        <span className="text-gray-600">•</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {achievement.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress indicator for specific achievements */}
                  {!isUnlocked && achievement.id.includes('bet_') && userStats && (
                    <div className="mt-4">
                      <div className="progress-bar h-2">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(
                              (userStats.totalBets / parseInt(achievement.id.split('_')[1])) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {userStats.totalBets} / {achievement.id.split('_')[1]} bets
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Achievements;
