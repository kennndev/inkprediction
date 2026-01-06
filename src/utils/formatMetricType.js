/**
 * Format metric type for display
 * Converts snake_case to readable text with proper pluralization
 */
export const formatMetricType = (metricType) => {
    if (!metricType) return 'metrics';

    // Convert snake_case to Title Case
    const formatted = metricType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    // Handle pluralization properly
    const pluralMap = {
        'Active Wallet': 'Active Wallets',
        'Deployed Contract': 'Deployed Contracts',
        'Transaction': 'Transactions',
        'Like': 'Likes',
        'Retweet': 'Retweets',
        'Reply': 'Replies',
        'View': 'Views',
        'Quote': 'Quotes',
        'User': 'Users',
        'Contract': 'Contracts',
        'Block Number': 'Blocks',
        'Gas Price': 'Gas Price', // No plural
        'Tvl': 'TVL', // No plural
    };

    return pluralMap[formatted] || formatted + 's';
};

/**
 * Generate a fallback question for a market
 */
export const generateFallbackQuestion = (market) => {
    const isInkChain = market.tweetId && market.tweetId.toString().startsWith('ink_');
    const targetK = (market.targetMetric / 1000).toFixed(1);
    const metricDisplay = formatMetricType(market.metricType);

    if (isInkChain) {
        return `Will this metric reach ${targetK}K ${metricDisplay}?`;
    } else {
        return `Will this tweet reach ${targetK}K ${metricDisplay}?`;
    }
};
