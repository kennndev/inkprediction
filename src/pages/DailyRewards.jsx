import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import axios from 'axios';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const DAILY_REWARDS = [
  { day: 1, xp: 10, bonus: null },
  { day: 2, xp: 15, bonus: null },
  { day: 3, xp: 20, bonus: null },
  { day: 4, xp: 25, bonus: null },
  { day: 5, xp: 35, bonus: null },
  { day: 6, xp: 50, bonus: null },
  { day: 7, xp: 100, bonus: 'Mystery Badge 🎁' },
];

const STREAK_MILESTONES = [
  { days: 7, reward: '🎖️ Week Warrior Badge', xpBonus: 200 },
  { days: 14, reward: '🏅 Fortnight Fighter Badge', xpBonus: 500 },
  { days: 30, reward: '🏆 Monthly Master Badge', xpBonus: 1500 },
  { days: 60, reward: '👑 Diamond Predictor Badge', xpBonus: 3000 },
  { days: 100, reward: '🌟 Century Legend Badge', xpBonus: 10000 },
];

const DailyRewards = () => {
  const { address, isConnected } = useAccount();
  const [rewardData, setRewardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [claimedReward, setClaimedReward] = useState(null);

  useEffect(() => {
    if (isConnected && address) {
      fetchRewardData();
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  const fetchRewardData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/user/${address}/daily-reward`);
      setRewardData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reward data:', error);
      setLoading(false);
    }
  };

  const claimReward = async () => {
    if (!rewardData?.canClaim) return;

    setClaiming(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.post(`${API_URL}/api/user/${address}/claim-daily`);

      if (response.data.success) {
        const reward = response.data.reward;
        setClaimedReward(reward);
        setShowCelebration(true);

        // Trigger confetti
        triggerConfetti();

        toast.success(`🎉 Claimed ${reward.xp} XP!`);

        // Update reward data
        setRewardData(prev => ({
          ...prev,
          canClaim: false,
          currentStreak: prev.currentStreak + 1,
          lastClaimed: new Date().toISOString(),
        }));

        // Hide celebration after 3 seconds
        setTimeout(() => {
          setShowCelebration(false);
          setClaimedReward(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward');
    } finally {
      setClaiming(false);
    }
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.7 }, zIndex: 9999 };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#FFD700', '#FFA500'] });
    fire(0.2, { spread: 60, colors: ['#A855F7', '#C084FC'] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#39FF14'] });
    fire(0.1, { spread: 120, startVelocity: 45, colors: ['#FF2D95'] });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-4">🎁</div>
          <h2 className="text-3xl font-bold text-gradient-cyber mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 text-lg">
            Connect your wallet to claim daily rewards
          </p>
        </motion.div>
      </div>
    );
  }

  const currentDayInWeek = rewardData ? ((rewardData.currentStreak % 7) || 7) : 1;
  const nextMilestone = STREAK_MILESTONES.find(m => m.days > (rewardData?.currentStreak || 0));

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
            Daily Rewards 🎁
          </h1>
          <p className="text-xl text-gray-300">
            Come back every day to claim XP and special bonuses!
          </p>
        </motion.div>

        {/* Celebration Overlay */}
        <AnimatePresence>
          {showCelebration && claimedReward && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="text-9xl mb-6"
                >
                  🎉
                </motion.div>
                <h2 className="text-4xl font-bold text-gradient-gold mb-4">
                  +{claimedReward.xp} XP!
                </h2>
                {claimedReward.bonus && (
                  <p className="text-2xl text-purple-300">
                    Bonus: {claimedReward.bonus}
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner w-16 h-16" />
          </div>
        ) : (
          <>
            {/* Current Streak */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="daily-reward-card mb-8"
            >
              <div className="daily-reward-content text-center">
                <div className="text-6xl mb-4">🔥</div>
                <div className="text-5xl font-bold text-gradient-fire mb-2">
                  {rewardData?.currentStreak || 0} Day Streak
                </div>
                <p className="text-gray-300">
                  {rewardData?.currentStreak === 0
                    ? "Start your streak today!"
                    : `Keep it going! Don't break the chain!`}
                </p>

                {/* Next Milestone Progress */}
                {nextMilestone && (
                  <div className="mt-6">
                    <div className="text-sm text-gray-400 mb-2">
                      Next milestone: {nextMilestone.reward}
                    </div>
                    <div className="xp-bar max-w-xs mx-auto">
                      <div
                        className="xp-fill"
                        style={{
                          width: `${((rewardData?.currentStreak || 0) / nextMilestone.days) * 100}%`
                        }}
                      />
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {rewardData?.currentStreak || 0} / {nextMilestone.days} days
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Claim Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <button
                onClick={claimReward}
                disabled={!rewardData?.canClaim || claiming}
                className={`px-12 py-4 rounded-2xl text-xl font-bold transition-all ${
                  rewardData?.canClaim
                    ? 'btn-gold animate-glow'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {claiming ? (
                  <span className="flex items-center gap-2">
                    <div className="spinner w-5 h-5" />
                    Claiming...
                  </span>
                ) : rewardData?.canClaim ? (
                  `Claim Day ${currentDayInWeek} Reward! 🎁`
                ) : (
                  `Come back tomorrow! ⏰`
                )}
              </button>

              {!rewardData?.canClaim && rewardData?.nextClaimTime && (
                <p className="text-gray-400 mt-3">
                  Next reward in: {getTimeUntilNextClaim(rewardData.nextClaimTime)}
                </p>
              )}
            </motion.div>

            {/* Weekly Rewards Grid */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="card mb-8"
            >
              <h3 className="text-xl font-bold mb-6 text-center">Weekly Rewards</h3>
              <div className="grid grid-cols-7 gap-2">
                {DAILY_REWARDS.map((reward) => {
                  const isClaimed = reward.day < currentDayInWeek ||
                    (reward.day === currentDayInWeek && !rewardData?.canClaim);
                  const isToday = reward.day === currentDayInWeek && rewardData?.canClaim;
                  const isFuture = reward.day > currentDayInWeek;

                  return (
                    <motion.div
                      key={reward.day}
                      whileHover={{ scale: 1.05 }}
                      className={`relative p-4 rounded-xl text-center ${
                        isToday
                          ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500/50 animate-glow'
                          : isClaimed
                            ? 'bg-green-500/20 border-2 border-green-500/30'
                            : 'purple-box'
                      }`}
                    >
                      {isClaimed && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mb-1">Day {reward.day}</div>
                      <div className={`text-2xl mb-1 ${isFuture ? 'opacity-50' : ''}`}>
                        {reward.day === 7 ? '🎁' : '⭐'}
                      </div>
                      <div className={`font-bold ${isToday ? 'text-yellow-400' : isClaimed ? 'text-green-400' : 'text-gray-300'}`}>
                        +{reward.xp} XP
                      </div>
                      {reward.bonus && (
                        <div className="text-xs text-purple-300 mt-1">
                          +Bonus
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Streak Milestones */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <h3 className="text-xl font-bold mb-6">Streak Milestones</h3>
              <div className="space-y-4">
                {STREAK_MILESTONES.map((milestone, index) => {
                  const isAchieved = (rewardData?.currentStreak || 0) >= milestone.days;
                  const progress = Math.min(
                    ((rewardData?.currentStreak || 0) / milestone.days) * 100,
                    100
                  );

                  return (
                    <motion.div
                      key={milestone.days}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className={`p-4 rounded-xl ${
                        isAchieved
                          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                          : 'purple-box'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-2xl ${!isAchieved ? 'grayscale' : ''}`}>
                            {milestone.reward.split(' ')[0]}
                          </span>
                          <div>
                            <div className={`font-bold ${isAchieved ? 'text-yellow-400' : 'text-gray-300'}`}>
                              {milestone.days} Day Streak
                            </div>
                            <div className="text-sm text-gray-400">
                              {milestone.reward}
                            </div>
                          </div>
                        </div>
                        <div className={`font-bold ${isAchieved ? 'text-gradient-gold' : 'text-gray-500'}`}>
                          +{milestone.xpBonus.toLocaleString()} XP
                        </div>
                      </div>

                      {!isAchieved && (
                        <div className="mt-2">
                          <div className="progress-bar h-2">
                            <div
                              className="progress-fill"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1 text-right">
                            {rewardData?.currentStreak || 0} / {milestone.days} days
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
};

const getTimeUntilNextClaim = (nextClaimTime) => {
  const now = new Date();
  const next = new Date(nextClaimTime);
  const diff = next - now;

  if (diff <= 0) return 'Now!';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
};

export default DailyRewards;
