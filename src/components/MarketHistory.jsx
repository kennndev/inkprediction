import { motion } from 'framer-motion';

const MarketHistory = ({ marketId, recentBets }) => {
  if (!recentBets || recentBets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <span className="text-4xl">📊</span>
        <p className="mt-2">No bets placed yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentBets.map((bet, index) => (
        <motion.div
          key={bet.id || index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center justify-between p-3 rounded-xl purple-box"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{bet.position ? '🟢' : '🔴'}</span>
            <div>
              <div className="font-mono text-sm text-gray-400">
                {bet.userAddress?.slice(0, 6)}...{bet.userAddress?.slice(-4)}
              </div>
              <div className="text-xs text-gray-500">
                {getTimeAgo(bet.timestamp || bet.createdAt)}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className={`font-bold ${bet.position ? 'text-green-400' : 'text-red-400'}`}>
              {bet.position ? 'YES' : 'NO'}
            </div>
            <div className="text-sm text-gray-400">
              {bet.amount} USDC
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const getTimeAgo = (timestamp) => {
  if (!timestamp) return 'Recently';
  
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  const seconds = Math.floor((Date.now() - time) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default MarketHistory;
