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
      // Convert snake_case to camelCase
      const market = {
        ...response.data.market,
        tweetId: response.data.market.tweet_id,
        tweetUrl: response.data.market.tweet_url,
        inkContractAddress: response.data.market.ink_contract_address,
        inkMetricEndpoint: response.data.market.ink_metric_endpoint,
        targetMetric: response.data.market.target_metric,
        metricType: response.data.market.metric_type,
        currentMetric: response.data.market.current_metric,
        marketId: response.data.market.market_id,
        finalMetric: response.data.market.final_metric,
        createdAt: response.data.market.created_at,
        createdBy: response.data.market.created_by,
        lastVerifiedAt: response.data.market.last_verified_at,
        yesPool: response.data.market.yes_pool || response.data.market.yesPool || 0,
        noPool: response.data.market.no_pool || response.data.market.noPool || 0
      };
      setMarket(market);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching market:', error);
      toast.error('Failed to load market');
      setLoading(false);
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
  }, [allowance, betAmount]);

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
    onSuccess: () => {
      triggerConfetti();
      toast.success('🎉 Bet Placed Successfully!');
      fetchMarket();
    },
  });

  const handleAction = (isYes) => {
    if (!isConnected) return toast.error('Connect Wallet First');
    if (!betAmount || parseFloat(betAmount) < 1) return toast.error('Min bet is 1 USDC');

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

  // Dynamic Market Info
  const isInkChain = market.category === 'INK CHAIN';
  const marketInfo = {
    emoji: market.emoji || (isInkChain ? '⛓️' : '🐦'),
    category: market.category || (isInkChain ? 'INK CHAIN' : 'TWITTER'),
    question: market.question
  };

  return (
    <div className="min-h-screen py-8 px-4 text-white font-console tracking-wide">
      <div className="max-w-6xl mx-auto">

        {/* Header - Arcade Marquee */}
        <Link to="/">
          <button className="arcade-btn bg-gray-800 px-4 py-2 mb-8 hover:bg-gray-700">
            ◀ BACK TO MARKETS
          </button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* LEFT: Game Screen */}
          <div className="space-y-8">
            <div className="arcade-card pixel-border-purple p-1 bg-black">
              <div className="p-6 bg-gray-900/50 min-h-[400px] flex flex-col justify-center items-center text-center relative overflow-hidden">
                <div className="text-6xl mb-6 animate-bounce-subtle">{marketInfo.emoji}</div>

                <h1 className="text-3xl md:text-4xl font-arcade text-shadow-neon text-white mb-8 leading-relaxed">
                  {marketInfo.question}
                </h1>

                <div className="w-full space-y-2 mb-8">
                  <div className="flex justify-between font-arcade text-xs text-neon-cyan">
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
                  <div className="bg-gray-800 p-4 border-2 border-green-500/30">
                    <div className="text-green-400 font-arcade text-xs mb-1">YES POOL</div>
                    <div className="text-2xl font-bold">{market.yesPool} USDC</div>
                  </div>
                  <div className="bg-gray-800 p-4 border-2 border-red-500/30">
                    <div className="text-red-400 font-arcade text-xs mb-1">NO POOL</div>
                    <div className="text-2xl font-bold">{market.noPool} USDC</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Control Deck */}
          <div className="relative">
            <div className="arcade-card p-8 bg-gray-900 bg-opacity-95 border-4 border-gray-700">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-arcade text-neon-yellow mb-2">PLACE PREDICTION</h2>
                <div className="h-1 w-full bg-neon-pink"></div>
              </div>

              {/* Bet Input First */}
              <div className="space-y-4 mb-8">
                <label className="font-arcade text-xs text-gray-400 ml-1">AMOUNT (USDC)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="w-full bg-black border-2 border-gray-600 text-neon-green font-arcade text-2xl p-4 text-center focus:border-neon-pink focus:outline-none"
                  />
                  <div className="absolute right-4 top-5 text-gray-500 font-arcade text-xs">USDC</div>
                </div>

                <div className="flex justify-center gap-2">
                  {['10', '50', '100', 'MAX'].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setBetAmount(amt === 'MAX' ? '1000' : amt)}
                      className="bg-gray-800 hover:bg-gray-700 text-white font-arcade text-xs px-3 py-2 border border-gray-600"
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
                <div className="text-center font-arcade text-sm text-neon-cyan p-4 bg-black/50 rounded-lg border border-neon-cyan/30">
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
