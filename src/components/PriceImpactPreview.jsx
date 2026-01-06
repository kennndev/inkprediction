import { useMemo } from 'react';
import { motion } from 'framer-motion';

const PriceImpactPreview = ({ market, betAmount }) => {
  const impact = useMemo(() => {
    const amount = parseFloat(betAmount) || 0;
    const yesPool = parseFloat(market.yesPool) || 0;
    const noPool = parseFloat(market.noPool) || 0;
    const totalPool = yesPool + noPool;

    if (totalPool === 0 || amount === 0) {
      return {
        yesAfter: 50,
        noAfter: 50,
        yesChange: 0,
        noChange: 0,
        potentialPayoutYes: amount * 2,
        potentialPayoutNo: amount * 2,
      };
    }

    // Calculate new odds after YES bet
    const newYesPool = yesPool + amount;
    const newTotalYes = newYesPool + noPool;
    const yesAfter = (newYesPool / newTotalYes) * 100;
    const noAfterYes = 100 - yesAfter;

    // Calculate new odds after NO bet
    const newNoPool = noPool + amount;
    const newTotalNo = yesPool + newNoPool;
    const noAfter = (newNoPool / newTotalNo) * 100;
    const yesAfterNo = 100 - noAfter;

    // Current odds
    const currentYes = (parseFloat(market.yesOdds) / 100);
    const currentNo = (parseFloat(market.noOdds) / 100);

    // Calculate potential payouts
    const potentialPayoutYes = amount * (newTotalYes / newYesPool);
    const potentialPayoutNo = amount * (newTotalNo / newNoPool);

    return {
      yesAfter: yesAfter.toFixed(1),
      noAfter: noAfter.toFixed(1),
      yesChange: (yesAfter - currentYes).toFixed(1),
      noChange: (noAfter - currentNo).toFixed(1),
      potentialPayoutYes: potentialPayoutYes.toFixed(2),
      potentialPayoutNo: potentialPayoutNo.toFixed(2),
    };
  }, [market, betAmount]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="impact-preview mb-6"
    >
      <h4 className="text-sm font-bold text-gray-400 mb-3">Price Impact Preview</h4>
      
      <div className="grid grid-cols-2 gap-4">
        {/* YES Impact */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500">If you bet YES</div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold">{impact.yesAfter}%</span>
            <span className={`odds-change ${parseFloat(impact.yesChange) > 0 ? 'positive' : 'negative'}`}>
              {parseFloat(impact.yesChange) > 0 ? '↑' : '↓'} {Math.abs(parseFloat(impact.yesChange))}%
            </span>
          </div>
          <div className="text-xs text-gray-400">
            Potential: <span className="text-green-400 font-bold">{impact.potentialPayoutYes} USDC</span>
          </div>
        </div>

        {/* NO Impact */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500">If you bet NO</div>
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-bold">{impact.noAfter}%</span>
            <span className={`odds-change ${parseFloat(impact.noChange) > 0 ? 'positive' : 'negative'}`}>
              {parseFloat(impact.noChange) > 0 ? '↑' : '↓'} {Math.abs(parseFloat(impact.noChange))}%
            </span>
          </div>
          <div className="text-xs text-gray-400">
            Potential: <span className="text-red-400 font-bold">{impact.potentialPayoutNo} USDC</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PriceImpactPreview;
