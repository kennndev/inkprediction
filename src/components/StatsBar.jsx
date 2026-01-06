import { motion } from 'framer-motion';

const StatsBar = ({ stats }) => {
  const statItems = [
    { label: 'Total Markets', value: stats.totalMarkets || 0, icon: '📊' },
    { label: 'Total Volume', value: `$${(stats.totalVolume || 0).toLocaleString()}`, icon: '💰' },
    { label: 'Active Users', value: stats.activeUsers || 0, icon: '👥' },
    { label: 'Predictions Made', value: stats.totalBets || 0, icon: '🎯' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
    >
      {statItems.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="glass rounded-xl p-4 text-center"
        >
          <span className="text-2xl">{stat.icon}</span>
          <div className="text-2xl font-bold text-gradient-purple mt-1">
            {stat.value}
          </div>
          <div className="text-xs text-gray-400">{stat.label}</div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StatsBar;
