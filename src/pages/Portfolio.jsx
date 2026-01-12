import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { Link } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

const CONTRACT_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "marketId", "type": "uint256" }],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const Portfolio = () => {
  const { address, isConnected } = useAccount();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ wins: 0, losses: 0, totalBet: 0 });

  useEffect(() => {
    if (isConnected && address) {
      fetchUserBets();
    }
  }, [address, isConnected]);

  const fetchUserBets = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/user/${address}/bets`);
      setBets(response.data.bets);
      calculateStats(response.data.bets);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bets:', error);
      setLoading(false);
    }
  };

  const calculateStats = (bets) => {
    const wins = bets.filter((b) => b.won && b.resolved).length;
    const losses = bets.filter((b) => !b.won && b.resolved).length;
    const totalBet = bets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    setStats({ wins, losses, totalBet });
  };

  if (!isConnected) {
    return <ConnectWalletPrompt />;
  }

  if (loading) {
    return <LoadingState />;
  }

  const activeBets = bets.filter((b) => !b.resolved);
  const resolvedBets = bets.filter((b) => b.resolved);
  const winRate = stats.wins + stats.losses > 0
    ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
    : 0;

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
            Your Portfolio 💼
          </h1>
          <p className="text-xl text-gray-300">
            Track your predictions and winnings
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon="📊"
            label="Total Bets"
            value={bets.length}
            gradient="from-purple-500 to-purple-700"
            delay={0.1}
          />
          <StatCard
            icon="✅"
            label="Wins"
            value={stats.wins}
            gradient="from-green-400 to-emerald-500"
            delay={0.2}
          />
          <StatCard
            icon="💰"
            label="Total Bet"
            value={`${stats.totalBet.toFixed(2)} USDC`}
            gradient="from-purple-500 to-purple-700"
            delay={0.3}
          />
          <StatCard
            icon="🎯"
            label="Win Rate"
            value={`${winRate}%`}
            gradient="from-neon-yellow to-orange-500"
            delay={0.4}
          />
        </div>

        {/* Active Bets */}
        {activeBets.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
              <span>🔥</span>
              <span>Active Bets</span>
              <span className="text-neon-purple">({activeBets.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeBets.map((bet, index) => (
                <BetCard key={bet.marketId} bet={bet} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Resolved Bets */}
        {resolvedBets.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
              <span>📋</span>
              <span>History</span>
            </h2>
            <div className="space-y-4">
              {resolvedBets.map((bet, index) => (
                <ResolvedBetCard key={bet.marketId} bet={bet} index={index} onClaimSuccess={fetchUserBets} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {bets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-gradient-cyber mb-4">
              No bets yet
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Start making predictions to build your portfolio!
            </p>
            <Link to="/">
              <button className="btn-primary">
                Browse Markets
              </button>
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const StatCard = ({ icon, label, value, gradient, delay }) => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ delay, type: 'spring', stiffness: 200, damping: 15 }}
    whileHover={{ scale: 1.05, y: -5 }}
    className={`card bg-gradient-to-br ${gradient} p-6 text-center cursor-default`}
  >
    <div className="text-5xl mb-3">{icon}</div>
    <div className="text-3xl font-bold mb-2">{value}</div>
    <div className="text-sm opacity-80">{label}</div>
  </motion.div>
);

const BetCard = ({ bet, index }) => (
  <motion.div
    initial={{ x: -50, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.02, y: -5 }}
    className="card"
  >
    <Link to={`/market/${bet.marketId}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{bet.position ? '✅ YES' : '❌ NO'}</span>
        <span className={`px-4 py-2 rounded-full font-bold ${bet.position
          ? 'bg-green-500/20 text-green-400'
          : 'bg-red-500/20 text-red-400'
          }`}>
          {bet.amount} USDC
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-400">
        <div>Market ID: #{bet.marketId}</div>
        <div>Tweet: {bet.tweetId.slice(0, 15)}...</div>
      </div>

      <div className="mt-4 text-center">
        <span className="text-neon-purple">⏳ Waiting for resolution...</span>
      </div>
    </Link>
  </motion.div>
);

const ResolvedBetCard = ({ bet, index, onClaimSuccess }) => {
  const [isClaiming, setIsClaiming] = useState(false);

  const { write: claimWinnings, data: claimData } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'claim',
  });

  const { isLoading: isClaimingTx } = useWaitForTransaction({
    hash: claimData?.hash,
    onSuccess: () => {
      setIsClaiming(false);
      toast.success('🎉 Winnings claimed successfully!');

      // Confetti celebration
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#A855F7', '#39FF14', '#FFD700'] });

      if (onClaimSuccess) onClaimSuccess();
    },
    onError: (error) => {
      setIsClaiming(false);
      toast.error('Claim failed: ' + error.message);
    }
  });

  const handleClaim = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isClaiming || isClaimingTx) return;

    setIsClaiming(true);
    toast('Submitting claim transaction...', { icon: '💰' });

    try {
      claimWinnings({ args: [parseInt(bet.marketId)] });
    } catch (error) {
      setIsClaiming(false);
      toast.error('Failed to claim: ' + error.message);
    }
  };

  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`card border-2 ${bet.won ? 'border-green-500/30' : 'border-red-500/30'}`}
    >
      <Link to={`/market/${bet.marketId}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">
              {bet.won ? '🎉' : '😔'}
            </div>
            <div>
              <div className="font-bold text-lg">
                {bet.position ? 'YES' : 'NO'} - {bet.amount} USDC
              </div>
              <div className="text-sm text-gray-400">
                Market #{bet.marketId}
              </div>
            </div>
          </div>

          <div className={`text-2xl font-bold ${bet.won ? 'text-green-400' : 'text-red-400'}`}>
            {bet.won ? '+WIN' : 'LOST'}
          </div>
        </div>

        {bet.won && !bet.claimed && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClaim}
            disabled={isClaiming || isClaimingTx}
            className="mt-4 w-full btn-primary disabled:opacity-50"
          >
            {isClaiming || isClaimingTx ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner w-4 h-4" />
                Claiming...
              </span>
            ) : (
              'Claim Winnings 💰'
            )}
          </motion.button>
        )}

        {bet.won && bet.claimed && (
          <div className="mt-4 text-center text-green-400 text-sm">
            ✅ Winnings Claimed
          </div>
        )}
      </Link>
    </motion.div>
  );
};

const ConnectWalletPrompt = () => (
  <div className="min-h-screen flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="text-8xl mb-4">👛</div>
      <h2 className="text-3xl font-bold text-gradient-cyber mb-4">
        Connect Your Wallet
      </h2>
      <p className="text-gray-400 text-lg mb-8">
        Connect your wallet to view your portfolio
      </p>
    </motion.div>
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="spinner w-16 h-16 mb-4" />
      <div className="text-xl text-gray-400">Loading portfolio...</div>
    </div>
  </div>
);

export default Portfolio;
