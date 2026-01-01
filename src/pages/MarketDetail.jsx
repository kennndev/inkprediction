import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useContractWrite, useWaitForTransaction, useContractRead } from 'wagmi';
import { ethers } from 'ethers';
// import { TwitterTweetEmbed } from 'react-twitter-embed'; // Disabled
// import { MARKET_INFO } from './Home'; // Removed
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import axios from 'axios';
import { normalizeMarketData } from '../utils/normalizeMarketData';
import { generateFallbackQuestion } from '../utils/formatMetricType';
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
    "inputs": [
      { "internalType": "uint256", "name": "marketId", "type": "uint256" }
    ],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "marketId", "type": "uint256" }
    ],
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
  const [betAmount, setBetAmount] = useState('1'); // Default 1 USDC
  const [needsApproval, setNeedsApproval] = useState(true);
  const [lastBetPosition, setLastBetPosition] = useState(null); // Track bet position for DB recording

  // Market info will be derived from market data after loading

  useEffect(() => {
    fetchMarket();
    const interval = setInterval(fetchMarket, 15000); // 15s to avoid 429 rate limits
    return () => clearInterval(interval);
  }, [id]);

  const fetchMarket = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/market/${id}`);
      console.log('Raw market from backend:', response.data.market);
      console.log('Question from backend:', response.data.market.question);
      const market = normalizeMarketData(response.data.market);
      console.log('Normalized market:', market);
      console.log('Question after normalization:', market.question);
      setMarket(market);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching market:', error);
      toast.error('Failed to load market');
      setLoading(false);
    }
  };

  // Record bet in database after successful blockchain transaction
  const recordBetInDatabase = async (marketId, amount, position, txHash) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      console.log('📤 Sending bet to database:', {
        API_URL,
        userAddress: address,
        marketId,
        amount,
        position,
        txHash
      });

      const response = await axios.post(`${API_URL}/api/user/bet`, {
        userAddress: address,
        marketId: marketId,
        amount: amount,
        position: position,
        transactionHash: txHash
      });

      console.log('✅ Bet recorded in database:', response.data);
    } catch (error) {
      console.error('❌ Failed to record bet in database:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Don't show error to user - bet is already on blockchain
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
    // Only need approval if wallet is connected AND allowance is insufficient
    if (!isConnected) {
      setNeedsApproval(false); // Show "BET YES/NO" when not connected
      return;
    }

    if (allowance !== undefined && betAmount) {
      try {
        const amountWei = ethers.utils.parseUnits(betAmount, 6);
        // Handle wagmi v1 BigInt return type by converting to string first
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
    // We'll pass args dynamically in the handler
  });

  const { isLoading: isBetting } = useWaitForTransaction({
    hash: betData?.hash,
    onSuccess: (data) => {
      triggerConfetti();
      toast.success('🎉 Bet Placed Successfully!');

      // Record bet in database
      if (lastBetPosition !== null) {
        recordBetInDatabase(
          id,
          betAmount,
          lastBetPosition,
          data.transactionHash
        );
      }

      fetchMarket();
    },
  });

  const handleAction = (isYes) => {
    if (!isConnected) return toast.error('Connect Wallet First');
    if (!betAmount || parseFloat(betAmount) < 1) return toast.error('Min bet is 1 USDC');

    // Store position for database recording after successful transaction
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
    fire(0.25, { spread: 26, startVelocity: 55, colors: ['#FF2D95', '#00FFFF'] });
    fire(0.2, { spread: 60, colors: ['#39FF14'] });
  };

  if (loading) return <LoadingState />;
  if (!market) return <NotFound />;

  const progress = (market.currentMetric / market.targetMetric) * 100;
  const potentialPayout = calculatePayout(betAmount, market);

  // Dynamic Market Info - use database values or generate fallback
  const isInkChain = market.category === 'INK CHAIN' || (market.tweetId && market.tweetId.toString().startsWith('ink_'));
  const marketInfo = {
    emoji: market.emoji || (isInkChain ? '⛓️' : '🐦'),
    category: market.category || (isInkChain ? 'INK CHAIN' : 'TWITTER'),
    question: market.question || generateFallbackQuestion(market)
  };

  return (
    <div className="min-h-screen py-8 px-4 text-white font-console tracking-wide">
      <div className="max-w-6xl mx-auto">

        {/* Header - Arcade Marquee */}
        <Link to="/">
          <button className="arcade-btn purple-box px-4 py-2 mb-8">
            ◀ BACK TO MARKETS
          </button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* LEFT: Game Screen */}
          <div className="space-y-8">
            <div className="arcade-card pixel-border-purple p-1">
              <div className="p-6 min-h-[400px] flex flex-col justify-center items-center text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(77, 57, 93, 0.4) 0%, rgba(45, 27, 61, 0.6) 100%)' }}>
                <div className="text-6xl mb-6 animate-bounce-subtle">{marketInfo.emoji}</div>

                <h1 className="text-3xl md:text-4xl font-arcade text-shadow-neon text-white mb-8 leading-relaxed">
                  {marketInfo.question}
                </h1>

                <div className="w-full space-y-2 mb-8">
                  <div className="flex justify-between font-arcade text-xs text-neon-purple">
                    <span>Current: {(market.currentMetric / 1000).toFixed(1)}K</span>
                    <span>Target: {(market.targetMetric / 1000).toFixed(1)}K</span>
                  </div>

                  {/* Retro Health Bar */}
                  <div className="health-bar-container">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className={`health-bar-segment ${(i / 20) * 100 < progress ? 'filled' : ''
                          }`}
                      />
                    ))}
                  </div>
                  <div className="text-right font-arcade text-neon-yellow text-sm">
                    {progress.toFixed(1)}% COMPLETE
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full text-center">
                  <div className="purple-box p-4 border-2 border-green-500/30">
                    <div className="text-green-400 font-arcade text-xs mb-1">YES POOL</div>
                    <div className="text-2xl font-bold">{market.yesPool} USDC</div>
                  </div>
                  <div className="purple-box p-4 border-2 border-red-500/30">
                    <div className="text-red-400 font-arcade text-xs mb-1">NO POOL</div>
                    <div className="text-2xl font-bold">{market.noPool} USDC</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Control Deck */}
          <div className="relative">
            <div className="arcade-card p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-arcade text-neon-yellow mb-2">PLACE PREDICTION</h2>
                <div className="h-1 w-full bg-neon-purple"></div>
              </div>

              {/* Bet Input First */}
              <div className="space-y-4 mb-8">
                <label className="font-arcade text-xs text-gray-400 ml-1">AMOUNT (USDC)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="w-full input-purple text-neon-green font-arcade text-2xl p-4 text-center"
                  />
                  <div className="absolute right-4 top-5 text-gray-500 font-arcade text-xs">USDC</div>
                </div>

                <div className="flex justify-center gap-2">
                  {['10', '50', '100', 'MAX'].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setBetAmount(amt === 'MAX' ? '1000' : amt)}
                      className="purple-box text-white font-arcade text-xs px-3 py-2"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <button
                  onClick={() => handleAction(true)}
                  disabled={isBetting || isApproving}
                  className={`rounded-2xl border-b-8 active:border-b-0 active:translate-y-2 transition-all p-6 flex flex-col items-center justify-center gap-2
                       ${needsApproval ? 'bg-yellow-500 border-yellow-700' : 'bg-green-500 border-green-700'}
                       hover:brightness-110 shadow-lg group
                     `}
                >
                  <div className="text-4xl">🚀</div>
                  <span className="font-arcade text-white text-xl">
                    {needsApproval ? 'APPROVE' : 'BET YES'}
                  </span>
                  <span className="text-[10px] uppercase">{needsApproval ? 'Unlock USDC' : 'Values will rise'}</span>
                </button>

                <button
                  onClick={() => handleAction(false)}
                  disabled={isBetting || isApproving}
                  className={`rounded-2xl border-b-8 active:border-b-0 active:translate-y-2 transition-all p-6 flex flex-col items-center justify-center gap-2
                       ${needsApproval ? 'bg-yellow-500 border-yellow-700' : 'bg-red-500 border-red-700'}
                       hover:brightness-110 shadow-lg group
                     `}
                >
                  <div className="text-4xl">📉</div>
                  <span className="font-arcade text-white text-xl">
                    {needsApproval ? 'APPROVE' : 'BET NO'}
                  </span>
                  <span className="text-[10px] uppercase">{needsApproval ? 'Unlock USDC' : 'Values will fall'}</span>
                </button>
              </div>

              {potentialPayout !== '0' && (
                <div className="text-center font-arcade text-sm text-neon-purple p-4 purple-box rounded-lg">
                  POTENTIAL WIN: {potentialPayout} USDC
                </div>
              )}

              <div className="mt-4 text-[10px] text-gray-500 text-center font-arcade">
                {needsApproval ? 'Creating allowance transaction...' : 'Transaction will be sent to network'}
              </div>

            </div>
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
      <Link to="/"><button className="arcade-btn bg-blue-500 px-6 py-3">BACK TO LIST</button></Link>
    </div>
  </div>
);

const calculatePayout = (betAmount, market) => {
  if (!betAmount) return '0';
  const bet = parseFloat(betAmount);
  // Estimate: 2x payout assumption for display
  return (bet * 2).toFixed(2);
};

export default MarketDetail;
