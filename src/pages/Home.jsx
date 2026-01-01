import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { normalizeMarketData } from '../utils/normalizeMarketData';
import { generateFallbackQuestion } from '../utils/formatMetricType';

const Home = () => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, ending-soon, popular

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

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

  const filteredMarkets = markets.filter((market) => {
    if (filter === 'ending-soon') {
      const timeLeft = market.deadline * 1000 - Date.now();
      return timeLeft < 6 * 60 * 60 * 1000; // Less than 6 hours
    }
    if (filter === 'popular') {
      const totalPool = parseFloat(market.yesPool) + parseFloat(market.noPool);
      return totalPool > 1; // More than 1 ETH
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Hero Section - Responsive Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12">
          {/* Content - Left on Desktop, Top on Mobile */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 text-center lg:text-left order-2 lg:order-1"
          >
            <motion.h1
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-gradient-cyber mb-4"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            >
              Predict the Viral 🚀
            </motion.h1>
            <p className="text-lg sm:text-xl text-gray-300">
              Bet on whether crypto tweets will hit their targets
            </p>
          </motion.div>

          {/* Image - Right on Desktop, Top on Mobile */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, rotate: 1 }}
            className="flex-1 w-full order-1 lg:order-2 max-w-md lg:max-w-lg mx-auto"
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
            >
              {/* Desktop: Larger size */}
              <style>{`
                @media (min-width: 1024px) {
                  .flex-1.order-1.lg\\:order-2 > div {
                    height: 400px !important;
                  }
                }
              `}</style>
            </div>
          </motion.div>
        </div>

        {/* Markets Grid */}
        {loading ? (
          <LoadingState />
        ) : filteredMarkets.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredMarkets.map((market, index) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const MarketCard = ({ market, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeLeft = getTimeLeft(market.deadline);
  const progress = (market.currentMetric / market.targetMetric) * 100;

  // Dynamic display info - use database values or generate fallback
  const isInkChain = market.category === 'INK CHAIN' || (market.tweetId && market.tweetId.toString().startsWith('ink_'));
  const category = market.category || (isInkChain ? 'INK CHAIN' : 'TWITTER');
  const emoji = market.emoji || (isInkChain ? '⛓️' : '🐦');

  // Use the question from the database, or generate a properly formatted fallback
  const question = market.question || generateFallbackQuestion(market);

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
      className="market-card group"
    >
      <Link to={`/market/${market.id}`}>
        <div className="relative">
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
                {(market.currentMetric / 1000).toFixed(1)}K ❤️
              </span>
            </div>

            {/* Animated Progress Bar */}
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
            className="glass rounded-xl px-4 py-3 mb-4 text-center"
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">⏰</span>
              <div>
                <div className="text-xs text-gray-400">Ends in</div>
                <div className="text-lg font-bold text-gradient-purple">
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

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-20"
  >
    <div className="text-8xl mb-4">🔮</div>
    <h2 className="text-3xl font-bold text-gradient-cyber mb-4">
      No markets yet
    </h2>
    <p className="text-gray-400 text-lg">
      Check back soon for trending predictions!
    </p>
  </motion.div>
);

// Helper functions
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
