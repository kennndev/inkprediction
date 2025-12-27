/**
 * Normalize market data from backend API
 * Handles both snake_case and camelCase field names
 * Converts string numbers to actual numbers
 * Handles BigNumber objects from ethers.js
 */
export const normalizeMarketData = (market) => {
    return {
        ...market,
        // Convert snake_case to camelCase and parse numbers
        targetMetric: parseFloat(market.target_metric || market.targetMetric || 0),
        currentMetric: parseFloat(market.current_metric || market.currentMetric || 0),
        metricType: market.metric_type || market.metricType,
        tweetId: market.tweet_id || market.tweetId,
        tweetUrl: market.tweet_url || market.tweetUrl,
        inkContractAddress: market.ink_contract_address || market.inkContractAddress,
        inkMetricEndpoint: market.ink_metric_endpoint || market.inkMetricEndpoint,
        marketId: market.market_id || market.marketId,
        createdAt: market.created_at || market.createdAt,
        createdBy: market.created_by || market.createdBy,
        finalMetric: market.final_metric || market.finalMetric,

        // Parse pool values
        yesPool: parseFloat(market.yesPool || market.yes_pool || 0),
        noPool: parseFloat(market.noPool || market.no_pool || 0),

        // Handle BigNumber objects for odds (from ethers.js)
        yesOdds: market.yesOdds?.hex
            ? parseInt(market.yesOdds.hex, 16)
            : parseFloat(market.yesOdds || market.yes_odds || 5000),
        noOdds: market.noOdds?.hex
            ? parseInt(market.noOdds.hex, 16)
            : parseFloat(market.noOdds || market.no_odds || 5000),
    };
};
