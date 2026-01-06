import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useContractWrite, useWaitForTransaction, useContractRead } from 'wagmi';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import axios from 'axios';
import { normalizeMarketData } from '../utils/normalizeMarketData';
import { generateFallbackQuestion } from '../utils/formatMetricType';
import PriceImpactPreview from '../components/PriceImpactPreview';
import CommentsSection from '../components/CommentsSection';
import ShareButtons from '../components/ShareButtons';
import MarketHistory from '../components/MarketHistory';

const USDC_ABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_marketId", "type": "uint256" },
      { "internalType": "bool", "name": "_isYes", "type": "bool" },
      { "internalType": "uint256", "name": "_amount", "type": "uint256" }
    ],
    "name": "bet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "marketId", "type": "uint256" }],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "marketId", "type": "uint256" }],
    "name": "claimRefund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;

const MarketDetail = () => {
  const { id } = useParams();
  const { address, isConnected } = useAccount();
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState('10');
  const [needsApproval, setNeedsApproval] = useState(true);
  const [lastBetPosition, setLastBetPosition] = useState(null);
  const [activeTab, setActiveTab] = useState('bet');
  const [recentBets, setRecentBets] = useState([]);

  useEffect(() => {
    fetchMarket();
    fetchRecentBets();
    const interval = setInterval(fetchMarket, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchMarket = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/market/${id}`);
      const market = normalizeMarketData(response.data.market);
      setMarket(market);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching market:', error);
      toast.error('Failed to load market');
      setLoading(false);
    }
  };

  const fetchRecentBets = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/market/${id}/bets`);
      setRecentBets(response.data.bets || []);
    } catch (error) {
      console.error('Error fetching recent bets:', error);
    }
  };

  const recordBetInDatabase = async (marketId, amount, position, txHash) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await axios.post(`${API_URL}/api/user/bet`, {
        userAddress: address,
        marketId: marketId,
        amount: amount,
        position: position,
        transactionHash: txHash
      });
    } catch (error) {
      console.error('Failed to record bet in database:', error);
    }
  };

  // Check Allowance
  const { data: allowance } = useContractRead({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [address, CONTRACT_ADDRESS],
    watch: true,
  });

  useEffect(() => {
    if (!isConnected) {
      setNeedsApproval(false);
      return;
    }

    if (allowance !== undefined && betAmount) {
      try {
        const amountWei = ethers.utils.parseUnits(betAmount, 6);
        const allowanceBN = ethers.BigNumber.from(allowance.toString());
        setNeedsApproval(allowanceBN.lt(amountWei));
      } catch (e) {
        console.error("Error checking allowance:", e);
      }
    }
  }, [allowance, betAmount, isConnected]);

  // Approve USDC
  const { write: approveUSDC, data: approveData } = useContractWrite({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'approve',
    args: [CONTRACT_ADDRESS, ethers.constants.MaxUint256],
  });

  const { isLoading: isApproving } = useWaitForTransaction({
    hash: approveData?.hash,
    onSuccess: () => {
      toast.success('🔓 USDC Approved! You can now place your bet.');
      setNeedsApproval(false);
    },
  });

  // Place Bet
  const { write: placeBet, data: betData } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'bet',
  });

  const { isLoading: isBetting } = useWaitForTransaction({
    hash: betData?.hash,
    onSuccess: (data) => {
      triggerConfetti();
      toast.success('🎉 Bet Placed Successfully! +50 XP');

      if (lastBetPosition !== null) {
        recordBetInDatabase(id, betAmount, lastBetPosition, data.transactionHash);
      }

      fetchMarket();
      fetchRecentBets();
    },
  });

  const handleAction = (isYes) => {
    if (!isConnected) return toast.error('Connect Wallet First');
    if (!betAmount || parseFloat(betAmount) < 1) return toast.error('Min bet is 1 USDC');

    setLastBetPosition(isYes);

    if (needsApproval) {
      toast('Approving USDC first...', { icon: '🔓' });
      approveUSDC();
    } else {
      try {
        const amountWei = ethers.utils.parseUnits(betAmount, 6);
        placeBet({ args: [id, isYes, amountWei] });
      } catch (e) {
        console.error("Bet error:", e);
        toast.error("Failed to prepare bet");
      }
    }
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.7 }, zIndex: 9999 };
    function fire(particleRatio, opts) {
      confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
    }
    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#A855F7', '#C084FC'] });
    fire(0.2, { spread: 60, colors: ['#39FF14', '#FFD700'] });
  };

  if (loading) return <LoadingState />;
  if (!market) return <NotFound />;

  const progress = (market.currentMetric / market.targetMetric) * 100;
  const totalPool = parseFloat(market.yesPool) + parseFloat(market.noPool);
  const timeLeft = getTimeLeft(market.deadline);
  const isExpired = market.deadline * 1000 < Date.now();

  const isInkChain = market.category === 'INK CHAIN' || (market.tweetId && market.tweetId.toString().startsWith('ink_'));
  const marketInfo = {
    emoji: market.emoji || (isInkChain ? '⛓️' : '🐦'),
    category: market.category || (isInkChain ? 'INK CHAIN' : 'TWITTER'),
    question: market.question || generateFallbackQuestion(market)
  };

  return (
    <div className="min-h-screen py-8 px-4 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <Link to="/">
            <button className="arcade-btn purple-box px-4 py-2">
              ◀ BACK TO MARKETS
            </button>
          </Link>

          <ShareButtons
            market={market}
            question={marketInfo.question}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Market Info (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="arcade-card pixel-border-purple p-1"
            >
              <div className="p-6 min-h-[300px] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(77, 57, 93, 0.4) 0%, rgba(45, 27, 61, 0.6) 100%)' }}>
                {/* Category Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-5xl">{marketInfo.emoji}</span>
                    <span className={`px-4 py-2 rounded-full font-mono text-sm ${marketInfo.category === 'INK CHAIN'
                        ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-900/50 text-blue-300 border border-blue-500/30'
                      }`}>
                      {marketInfo.category}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {market.resolved ? (
                    <span className="badge badge-gold">Resolved</span>
                  ) : isExpired ? (
                    <span className="badge bg-red-500/20 border-red-500/50 text-red-400">Expired</span>
                  ) : (
                    <span className="badge bg-green-500/20 border-green-500/50 text-green-400">Active</span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl lg:text-4xl font-arcade text-shadow-neon text-white mb-6 leading-tight">
                  {marketInfo.question}
                </h1>

                {/* Progress */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between font-arcade text-sm">
                    <span className="text-gray-400">Current: <span className="text-white">{(market.currentMetric / 1000).toFixed(1)}K</span></span>
                    <span className="text-gray-400">Target: <span className="text-gradient-pink">{(market.targetMetric / 1000).toFixed(1)}K</span></span>
                  </div>

                  <div className="health-bar-container">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className={`health-bar-segment ${(i / 20) * 100 < progress ? 'filled' : ''}`}
                      />
                    ))}
                  </div>

                  <div className="text-right font-arcade text-neon-yellow text-sm">
                    {progress.toFixed(1)}% COMPLETE
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="purple-box p-3 sm:p-4 rounded-xl text-center">
                    <div className="text-gray-400 text-[10px] sm:text-xs mb-1">YES POOL</div>
                    <div className="text-base sm:text-xl font-bold text-green-400">{market.yesPool} USDC</div>
                  </div>
                  <div className="purple-box p-3 sm:p-4 rounded-xl text-center">
                    <div className="text-gray-400 text-[10px] sm:text-xs mb-1">NO POOL</div>
                    <div className="text-base sm:text-xl font-bold text-red-400">{market.noPool} USDC</div>
                  </div>
                  <div className="purple-box p-3 sm:p-4 rounded-xl text-center">
                    <div className="text-gray-400 text-[10px] sm:text-xs mb-1">VOLUME</div>
                    <div className="text-base sm:text-xl font-bold text-gradient-gold">{totalPool.toFixed(1)} USDC</div>
                  </div>
                  <div className="purple-box p-3 sm:p-4 rounded-xl text-center">
                    <div className="text-gray-400 text-[10px] sm:text-xs mb-1">TIME</div>
                    <div className={`text-base sm:text-xl font-bold ${isExpired ? 'text-red-400' : 'text-gradient-purple'}`}>
                      {timeLeft}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tabs Section */}
            <div className="card">
              <div className="flex border-b border-purple-500/20 mb-6">
                {['history', 'comments'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  >
                    {tab === 'history' && '📊 Market History'}
                    {tab === 'comments' && '💬 Comments'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <MarketHistory marketId={id} recentBets={recentBets} />
                  </motion.div>
                )}

                {activeTab === 'comments' && (
                  <motion.div
                    key="comments"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <CommentsSection marketId={id} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT: Betting Panel */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="arcade-card p-6 sticky top-24"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-arcade text-neon-yellow mb-2">PLACE PREDICTION</h2>
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-neon-purple to-transparent"></div>
              </div>

              {/* Current Odds */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="purple-box p-4 rounded-xl text-center border-2 border-green-500/30">
                  <div className="text-xs text-gray-400 mb-1">YES ODDS</div>
                  <div className="text-3xl font-bold text-green-400">
                    {(parseFloat(market.yesOdds) / 100).toFixed(1)}%
                  </div>
                </div>
                <div className="purple-box p-4 rounded-xl text-center border-2 border-red-500/30">
                  <div className="text-xs text-gray-400 mb-1">NO ODDS</div>
                  <div className="text-3xl font-bold text-red-400">
                    {(parseFloat(market.noOdds) / 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Bet Amount Input */}
              <div className="space-y-4 mb-6">
                <label className="font-arcade text-xs text-gray-400">AMOUNT (USDC)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    disabled={isExpired || market.resolved}
                    className="w-full input-purple text-neon-green font-arcade text-2xl p-4 text-center rounded-xl"
                  />
                  <div className="absolute right-4 top-5 text-gray-500 font-arcade text-xs">USDC</div>
                </div>

                <div className="flex justify-center gap-2">
                  {['10', '50', '100', '500'].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setBetAmount(amt)}
                      disabled={isExpired || market.resolved}
                      className="purple-box text-white font-arcade text-xs px-3 py-2 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Impact Preview */}
              {betAmount && parseFloat(betAmount) > 0 && !isExpired && !market.resolved && (
                <PriceImpactPreview
                  market={market}
                  betAmount={betAmount}
                />
              )}

              {/* Action Buttons */}
              {!isExpired && !market.resolved ? (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => handleAction(true)}
                    disabled={isBetting || isApproving}
                    className={`rounded-2xl border-b-8 active:border-b-0 active:translate-y-2 transition-all p-4 flex flex-col items-center justify-center gap-2
                      ${needsApproval ? 'bg-amber-500 border-amber-700' : 'bg-green-500 border-green-700'}
                      hover:brightness-110 shadow-lg disabled:opacity-50
                    `}
                  >
                    <div className="text-3xl">{needsApproval ? '🔓' : '🚀'}</div>
                    <span className="font-arcade text-white text-sm">
                      {needsApproval ? 'APPROVE' : 'BET YES'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleAction(false)}
                    disabled={isBetting || isApproving}
                    className={`rounded-2xl border-b-8 active:border-b-0 active:translate-y-2 transition-all p-4 flex flex-col items-center justify-center gap-2
                      ${needsApproval ? 'bg-amber-500 border-amber-700' : 'bg-red-500 border-red-700'}
                      hover:brightness-110 shadow-lg disabled:opacity-50
                    `}
                  >
                    <div className="text-3xl">{needsApproval ? '🔓' : '📉'}</div>
                    <span className="font-arcade text-white text-sm">
                      {needsApproval ? 'APPROVE' : 'BET NO'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="text-center p-6 purple-box rounded-xl mb-6">
                  <div className="text-4xl mb-2">{market.resolved ? '🏆' : '⏰'}</div>
                  <div className="text-gray-400">
                    {market.resolved ? 'Market has been resolved' : 'Market has expired'}
                  </div>
                </div>
              )}

              {/* Transaction Status */}
              {(isBetting || isApproving) && (
                <div className="text-center p-4 purple-box rounded-xl animate-pulse">
                  <div className="spinner mx-auto mb-2" />
                  <div className="text-sm text-gray-400">
                    {isApproving ? 'Approving USDC...' : 'Placing bet...'}
                  </div>
                </div>
              )}

              {/* XP Reward Info */}
              <div className="text-center p-4 glass rounded-xl">
                <div className="text-sm text-gray-400">
                  🎮 Earn <span className="text-gradient-gold font-bold">+50 XP</span> for each bet
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center text-center">
    <div>
      <div className="spinner-pixel mx-auto mb-4"></div>
      <div className="font-arcade text-neon-green animate-pulse">LOADING MARKET...</div>
    </div>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center text-center">
    <div>
      <div className="text-6xl mb-4">❌</div>
      <h2 className="font-arcade text-2xl text-red-500 mb-4">MARKET NOT FOUND</h2>
      <Link to="/"><button className="btn-primary">Back to Markets</button></Link>
    </div>
  </div>
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

export default MarketDetail;
