import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const FeaturedCarousel = ({ markets }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const carouselRef = useRef(null);

  useEffect(() => {
    if (carouselRef.current) {
      setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
    }
  }, [markets]);

  // Auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % markets.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [markets.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + markets.length) % markets.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % markets.length);
  };

  if (!markets.length) return null;

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="carousel-nav left-2 hover:scale-110 transition-transform"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="carousel-nav right-2 hover:scale-110 transition-transform"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Carousel */}
      <div className="carousel-container" ref={carouselRef}>
        <motion.div
          className="carousel-track"
          animate={{ x: -currentIndex * 100 + '%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {markets.map((market, index) => (
            <div key={market.id} className="carousel-item w-full flex-shrink-0">
              <FeaturedCard market={market} isActive={index === currentIndex} />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {markets.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-purple-500 w-8'
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const FeaturedCard = ({ market, isActive }) => {
  const totalPool = parseFloat(market.yesPool) + parseFloat(market.noPool);
  const progress = (market.currentMetric / market.targetMetric) * 100;
  const timeLeft = getTimeLeft(market.deadline);

  const isInkChain = market.category === 'INK CHAIN' || market.tweetId?.startsWith('ink_');

  return (
    <Link to={`/market/${market.id}`}>
      <motion.div
        animate={{ scale: isActive ? 1 : 0.95, opacity: isActive ? 1 : 0.7 }}
        className="market-card-featured p-6 mx-4"
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left - Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{market.emoji || (isInkChain ? '⛓️' : '🐦')}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-mono ${
                isInkChain
                  ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30'
                  : 'bg-blue-900/50 text-blue-300 border border-blue-500/30'
              }`}>
                {market.category || (isInkChain ? 'INK CHAIN' : 'TWITTER')}
              </span>
              <span className="badge badge-gold">🔥 Featured</span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
              {market.question}
            </h3>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Progress: {progress.toFixed(1)}%</span>
                <span className="text-gradient-pink">{(market.targetMetric / 1000).toFixed(1)}K target</span>
              </div>
              <div className="progress-bar h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 1 }}
                  className="progress-fill"
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Pool:</span>
                <span className="text-gradient-gold font-bold">{totalPool.toFixed(2)} USDC</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Ends:</span>
                <span className="text-gradient-purple font-bold">{timeLeft}</span>
              </div>
            </div>
          </div>

          {/* Right - Odds */}
          <div className="flex md:flex-col gap-4 justify-center">
            <div className="glass-strong rounded-xl p-4 text-center min-w-[100px] border-2 border-green-500/30">
              <div className="text-xs text-gray-400 mb-1">YES</div>
              <div className="text-2xl font-bold text-green-400">
                {(parseFloat(market.yesOdds) / 100).toFixed(1)}%
              </div>
            </div>
            <div className="glass-strong rounded-xl p-4 text-center min-w-[100px] border-2 border-red-500/30">
              <div className="text-xs text-gray-400 mb-1">NO</div>
              <div className="text-2xl font-bold text-red-400">
                {(parseFloat(market.noOdds) / 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Hover CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="mt-4 text-center"
        >
          <span className="btn-primary">Place Your Bet →</span>
        </motion.div>
      </motion.div>
    </Link>
  );
};

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

export default FeaturedCarousel;
