import { motion } from 'framer-motion';

const StreakBadge = ({ streak }) => {
  if (!streak || streak <= 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="streak-badge"
    >
      <span className="text-xl">🔥</span>
      <span className="font-bold">{streak} Win Streak!</span>
    </motion.div>
  );
};

export default StreakBadge;
