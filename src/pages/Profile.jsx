import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import axios from 'axios';

const Profile = () => {
  const { address: paramAddress } = useParams();
  const { address: walletAddress, isConnected } = useAccount();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const profileAddress = paramAddress || walletAddress;
  const isOwnProfile = isConnected && walletAddress?.toLowerCase() === profileAddress?.toLowerCase();

  useEffect(() => {
    if (profileAddress) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [profileAddress]);

  const fetchProfile = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const [statsRes, achievementsRes, betsRes] = await Promise.all([
        axios.get(`${API_URL}/api/user/${profileAddress}/stats`),
        axios.get(`${API_URL}/api/user/${profileAddress}/achievements`),
        axios.get(`${API_URL}/api/user/${profileAddress}/bets`),
      ]);

      setProfile({
        address: profileAddress,
        stats: statsRes.data,
        achievements: achievementsRes.data.achievements || [],
        bets: betsRes.data.bets || [],
        level: calculateLevel(statsRes.data.xp || 0),
        xp: statsRes.data.xp || 0,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Set mock data
      setProfile({
        address: profileAddress,
        stats: { wins: 0, losses: 0, totalBet: 0, winRate: 0, streak: 0 },
        achievements: [],
        bets: [],
        level: 1,
        xp: 0,
      });
      setLoading(false);
    }
  };

  if (!profileAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-4">👤</div>
          <h2 className="text-3xl font-bold text-gradient-cyber mb-4">
            No Profile Selected
          </h2>
          <p className="text-gray-400 text-lg">
            Connect your wallet to view your profile
          </p>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-16 h-16" />
      </div>
    );
  }

  const xpProgress = getXPProgress(profile.xp, profile.level);
  const xpForNext = getXPForNextLevel(profile.level);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar / Level Badge */}
            <div className="relative">
              <div className="level-badge-large text-3xl">
                {profile.level}
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400">
                LVL
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold font-mono text-gradient-cyber">
                {profileAddress.slice(0, 6)}...{profileAddress.slice(-4)}
              </h1>
              {isOwnProfile && (
                <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300">
                  Your Profile
                </span>
              )}

              {/* XP Progress */}
              <div className="mt-4 max-w-xs mx-auto md:mx-0">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{profile.xp} XP</span>
                  <span>{xpForNext} XP</span>
                </div>
                <div className="xp-bar">
                  <div className="xp-fill" style={{ width: `${xpProgress}%` }} />
                </div>
              </div>
            </div>

            {/* Streak */}
            {profile.stats.streak > 0 && (
              <div className="streak-badge">
                <span>🔥</span>
                <span>{profile.stats.streak} Streak</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon="🎯" label="Total Bets" value={profile.bets.length} />
          <StatCard icon="🏆" label="Wins" value={profile.stats.wins || 0} />
          <StatCard icon="📊" label="Win Rate" value={`${profile.stats.winRate || 0}%`} />
          <StatCard icon="💰" label="Volume" value={`${profile.stats.totalBet || 0} USDC`} />
        </div>

        {/* Achievements */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Achievements</h2>
            <Link to="/achievements" className="text-purple-400 hover:text-purple-300 text-sm">
              View All →
            </Link>
          </div>

          {profile.achievements.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {profile.achievements.slice(0, 8).map((achievement) => (
                <div
                  key={achievement}
                  className="badge badge-gold"
                  title={achievement}
                >
                  {getAchievementEmoji(achievement)} {formatAchievementName(achievement)}
                </div>
              ))}
              {profile.achievements.length > 8 && (
                <span className="badge">+{profile.achievements.length - 8} more</span>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              No achievements yet
            </p>
          )}
        </motion.div>

        {/* Recent Bets */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>

          {profile.bets.length > 0 ? (
            <div className="space-y-3">
              {profile.bets.slice(0, 5).map((bet, index) => (
                <Link key={index} to={`/market/${bet.marketId}`}>
                  <div className="purple-box p-4 rounded-xl hover:bg-purple-500/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{bet.position ? '🟢' : '🔴'}</span>
                        <div>
                          <div className="font-bold">
                            {bet.position ? 'YES' : 'NO'} on Market #{bet.marketId}
                          </div>
                          <div className="text-sm text-gray-400">
                            {bet.amount} USDC
                          </div>
                        </div>
                      </div>
                      {bet.resolved && (
                        <span className={bet.won ? 'text-green-400' : 'text-red-400'}>
                          {bet.won ? '✅ Won' : '❌ Lost'}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              No betting activity yet
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="card text-center"
  >
    <div className="text-2xl mb-1">{icon}</div>
    <div className="text-xl font-bold text-gradient-purple">{value}</div>
    <div className="text-xs text-gray-400">{label}</div>
  </motion.div>
);

const calculateLevel = (xp) => Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
const getXPForNextLevel = (level) => level * level * 100;
const getXPProgress = (xp, level) => {
  const currentLevelXP = (level - 1) * (level - 1) * 100;
  const nextLevelXP = level * level * 100;
  return ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
};

const getAchievementEmoji = (id) => {
  const emojis = {
    first_bet: '🎯', bet_10: '🔟', first_win: '🎉', streak_3: '🔥', streak_5: '🌟',
  };
  return emojis[id] || '🏅';
};

const formatAchievementName = (id) => {
  return id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default Profile;
