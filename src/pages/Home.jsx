import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAccount } from 'wagmi';
import { normalizeMarketData } from '../utils/normalizeMarketData';
import { generateFallbackQuestion } from '../utils/formatMetricType';
import FeaturedCarousel from '../components/FeaturedCarousel';
import CategoryFilter from '../components/CategoryFilter';
import StatsBar from '../components/StatsBar';
import DailyRewardBanner from '../components/DailyRewardBanner';
import StreakBadge from '../components/StreakBadge';

const Home = () => {
  const { address, isConnected } = useAccount();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [userStats, setUserStats] = useState(null);
  const [platformStats, setPlatformStats] = useState({
    totalMarkets: 0,
    totalVolume: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    fetchMarkets();
    fetchPlatformStats();
    const interval = setInterval(fetchMarkets, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserStats();
    }
  }, [address, isConnected]);

  const fetchMarkets = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/markets`);
      const markets = response.data.markets.map(normalizeMarketData);
      setMarkets(markets);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching markets:', error);
      toast.error('Failed to load markets');
      setLoading(false);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/stats/platform`);
      setPlatformStats(response.data);
    } catch (error) {
      console.error('Error fetching platform stats:', error);
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

  // Filter markets
  const filteredMarkets = markets.filter((market) => {
    // Category filter
    if (categoryFilter !== 'all') {
      const isInk = market.category === 'INK CHAIN' || market.tweetId?.startsWith('ink_');
      if (categoryFilter === 'ink' && !isInk) return false;
      if (categoryFilter === 'twitter' && isInk) return false;
    }

    // Time filter
    if (filter === 'ending-soon') {
      const timeLeft = market.deadline * 1000 - Date.now();
      return timeLeft < 6 * 60 * 60 * 1000 && timeLeft > 0;
    }
    if (filter === 'popular') {
      const totalPool = parseFloat(market.yesPool) + parseFloat(market.noPool);
      return totalPool > 10;
    }
    if (filter === 'new') {
      const createdAt = market.createdAt * 1000;
      return Date.now() - createdAt < 24 * 60 * 60 * 1000;
    }

    return true;
  });

  // Sort markets
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (sortBy === 'newest') {
      return (b.createdAt || 0) - (a.createdAt || 0);
    }
    if (sortBy === 'ending') {
      return a.deadline - b.deadline;
    }
    if (sortBy === 'popular') {
      const poolA = parseFloat(a.yesPool) + parseFloat(a.noPool);
      const poolB = parseFloat(b.yesPool) + parseFloat(b.noPool);
      return poolB - poolA;
    }
    return 0;
  });

  // Featured markets (highest volume)
  const featuredMarkets = [...markets]
    .sort((a, b) => {
      const poolA = parseFloat(a.yesPool) + parseFloat(a.noPool);
      const poolB = parseFloat(b.yesPool) + parseFloat(b.noPool);
      return poolB - poolA;
    })
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Daily Reward Banner */}
        {isConnected && <DailyRewardBanner />}

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 text-center lg:text-left"
          >
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
              <motion.h1
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-gradient-cyber"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              >
                Predict the Viral 🚀
              </motion.h1>
              {userStats?.streak > 0 && <StreakBadge streak={userStats.streak} />}
            </div>
            <p className="text-lg sm:text-xl text-gray-300 mb-4">
              Bet on everything
            </p>

            {/* Quick Stats */}
            {isConnected && userStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
              >
                <div className="glass px-4 py-2 rounded-full">
                  <span className="text-gray-400">Level</span>
                  <span className="ml-2 font-bold text-gradient-gold">{userStats.level || 1}</span>
                </div>
                <div className="glass px-4 py-2 rounded-full">
                  <span className="text-gray-400">XP</span>
                  <span className="ml-2 font-bold text-gradient-purple">{userStats.xp || 0}</span>
                </div>
                <div className="glass px-4 py-2 rounded-full">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="ml-2 font-bold text-green-400">{userStats.winRate || 0}%</span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, rotate: 1 }}
            className="flex-1 w-full max-w-md lg:max-w-lg mx-auto"
          >
            <div
              className="w-full rounded-3xl overflow-hidden glass-strong border-2 border-purple-500/30 shadow-2xl"
              style={{
                height: '300px',
                backgroundImage: 'url(/hawaii.png)',
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                boxShadow: '0 0 40px rgba(168, 85, 247, 0.3), 0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            />
          </motion.div>
        </div>

        {/* Platform Stats Bar */}
        <StatsBar stats={platformStats} />

        {/* Featured Markets Carousel */}
        {featuredMarkets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-gradient-fire">🔥 Hot Markets</span>
            </h2>
            <FeaturedCarousel markets={featuredMarkets} />
          </motion.div>
        )}

        {/* Filters & Sort */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Category Filter */}
            <CategoryFilter
              selected={categoryFilter}
              onChange={setCategoryFilter}
            />

            {/* Time Filter & Sort */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2">
                {['all', 'new', 'ending-soon', 'popular'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`filter-btn ${filter === f ? 'active' : ''}`}
                  >
                    {f === 'all' && '📋 All'}
                    {f === 'new' && '✨ New'}
                    {f === 'ending-soon' && '⏰ Ending Soon'}
                    {f === 'popular' && '🔥 Popular'}
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-purple px-4 py-2 rounded-full text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="ending">Ending Soon</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Markets Grid */}
        {loading ? (
          <LoadingState />
        ) : sortedMarkets.length === 0 ? (
          <EmptyState categoryFilter={categoryFilter} />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {sortedMarkets.map((market, index) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Create Market CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="glass-strong rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gradient-cyber mb-4">
              Have a Prediction? 🎯
            </h3>
            <p className="text-gray-300 mb-6">
              Create your own prediction market and let the community decide!
            </p>
            <Link to="/create">
              <button className="btn-gold font-bold">
                Propose a Market →
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const MarketCard = ({ market, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeLeft = getTimeLeft(market.deadline);
  const progress = (market.currentMetric / market.targetMetric) * 100;
  const totalPool = parseFloat(market.yesPool) + parseFloat(market.noPool);

  const isInkChain = market.category === 'INK CHAIN' || (market.tweetId && market.tweetId.toString().startsWith('ink_'));
  const category = market.category || (isInkChain ? 'INK CHAIN' : 'TWITTER');
  const emoji = market.emoji || (isInkChain ? '⛓️' : '🐦');
  const question = market.question || generateFallbackQuestion(market);

  // Check if market is ending soon (< 2 hours)
  const isEndingSoon = market.deadline * 1000 - Date.now() < 2 * 60 * 60 * 1000;
  const isHot = totalPool > 50;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotateX: 15 }}
      transition={{
        delay: index * 0.1,
        type: 'spring',
        stiffness: 100,
        damping: 20
      }}
      whileHover={{
        y: -10,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`market-card group ${isHot ? 'market-card-featured' : ''}`}
    >
      <Link to={`/market/${market.id}`}>
        <div className="relative">
          {/* Status Badges */}
          <div className="absolute -top-3 -left-3 flex gap-2 z-10">
            {isEndingSoon && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="badge bg-red-500/20 border-red-500/50 text-red-400 text-xs"
              >
                ⏰ Ending Soon
              </motion.span>
            )}
            {isHot && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="badge badge-gold text-xs"
              >
                🔥 Hot
              </motion.span>
            )}
          </div>

          {/* Prediction Question */}
          <div className="mb-4 p-5 glass-strong rounded-2xl border-2 border-neon-purple/30">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-3xl">{emoji}</span>
              <span className={`text-xs font-mono px-2 py-1 rounded ${category === 'INK CHAIN'
                ? 'bg-purple-900/50 text-purple-300'
                : 'bg-blue-900/50 text-blue-300'
              }`}>
                {category}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white leading-tight">
              {question}
            </h3>
          </div>

          {/* Target Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
            className="absolute -top-3 -right-3 glass-strong rounded-full px-4 py-2 border border-neon-purple/50"
          >
            <div className="text-xs font-mono text-gray-400">TARGET</div>
            <div className="text-lg font-bold text-gradient-pink">
              {(market.targetMetric / 1000).toFixed(1)}K
            </div>
          </motion.div>

          {/* Progress Section */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Current Progress</span>
              <span className="text-lg font-bold text-gradient-cyber">
                {(market.currentMetric / 1000).toFixed(1)}K
              </span>
            </div>

            <div className="progress-bar">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{
                  delay: index * 0.1 + 0.5,
                  duration: 1,
                  ease: 'easeOut'
                }}
                className="progress-fill"
              />
            </div>

            <div className="text-sm text-center">
              <span className="text-neon-yellow font-bold">
                {progress.toFixed(1)}%
              </span>
              <span className="text-gray-400"> achieved</span>
            </div>
          </div>

          {/* Time Left */}
          <motion.div
            animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
            className={`glass rounded-xl px-4 py-3 mb-4 text-center ${isEndingSoon ? 'border border-red-500/30' : ''}`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">{isEndingSoon ? '🚨' : '⏰'}</span>
              <div>
                <div className="text-xs text-gray-400">Ends in</div>
                <div className={`text-lg font-bold ${isEndingSoon ? 'text-red-400' : 'text-gradient-purple'}`}>
                  {timeLeft}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Odds Display */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="glass-strong rounded-xl p-3 text-center border-2 border-green-500/30"
            >
              <div className="text-xs text-gray-400 mb-1">YES</div>
              <div className="text-2xl font-bold text-green-400">
                {(parseFloat(market.yesOdds) / 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {market.yesPool} USDC
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="glass-strong rounded-xl p-3 text-center border-2 border-red-500/30"
            >
              <div className="text-xs text-gray-400 mb-1">NO</div>
              <div className="text-2xl font-bold text-red-400">
                {(parseFloat(market.noOdds) / 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {market.noPool} USDC
              </div>
            </motion.div>
          </div>

          {/* Pool Size */}
          <div className="text-center text-sm text-gray-400 mb-4">
            Total Pool: <span className="text-white font-bold">{totalPool.toFixed(2)} USDC</span>
          </div>

          {/* Hover CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            className="text-center"
          >
            <div className="btn-primary inline-block">
              Place Your Bet 🎯
            </div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};

const LoadingState = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: i * 0.1 }}
        className="card h-96"
      >
        <div className="space-y-4">
          <div className="skeleton h-48 w-full" />
          <div className="skeleton-text w-3/4" />
          <div className="skeleton-text w-1/2" />
          <div className="grid grid-cols-2 gap-3">
            <div className="skeleton h-20" />
            <div className="skeleton h-20" />
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

const EmptyState = ({ categoryFilter }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-20"
  >
    <div className="text-8xl mb-4">🔮</div>
    <h2 className="text-3xl font-bold text-gradient-cyber mb-4">
      No {categoryFilter !== 'all' ? categoryFilter.toUpperCase() + ' ' : ''}markets yet
    </h2>
    <p className="text-gray-400 text-lg mb-6">
      {categoryFilter !== 'all' 
        ? `Try a different category or check back soon!`
        : `Check back soon for trending predictions!`
      }
    </p>
    <Link to="/create">
      <button className="btn-primary">Create the First Market</button>
    </Link>
  </motion.div>
);

const getTimeLeft = (deadline) => {
  const now = Date.now();
  const end = deadline * 1000;
  const diff = end - now;

  if (diff < 0) return 'Ended';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours}h ${minutes}m`;
};

export default Home;
