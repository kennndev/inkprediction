import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import axios from 'axios';

const DailyRewardBanner = () => {
  const { address, isConnected } = useAccount();
  const [canClaim, setCanClaim] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      checkRewardStatus();
    }
  }, [address, isConnected]);

  const checkRewardStatus = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/user/${address}/daily-reward`);
      setCanClaim(response.data.canClaim);
    } catch (error) {
      console.error('Error checking reward status:', error);
    }
  };

  if (!canClaim || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative mb-6 p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-4xl"
            >
              🎁
            </motion.span>
            <div>
              <h3 className="font-bold text-yellow-400">Daily Reward Available!</h3>
              <p className="text-sm text-gray-300">Claim your free XP now!</p>
            </div>
          </div>

          <Link to="/daily-rewards">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-gold"
            >
              Claim Now →
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DailyRewardBanner;
