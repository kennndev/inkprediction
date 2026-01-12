import { useState } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ADMIN_WALLET = import.meta.env.VITE_ADMIN_WALLET || '';

const Admin = () => {
    const { address, isConnected } = useAccount();

    // Check if connected wallet is admin
    const isAdmin = isConnected && address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

    if (!isConnected) {
        return <ConnectWalletPrompt />;
    }

    if (!isAdmin) {
        return <UnauthorizedAccess />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen py-4 sm:py-8 px-3 sm:px-4 lg:px-8"
        >
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-6 sm:mb-8 text-center sm:text-left"
                >
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gradient-cyber mb-2 sm:mb-4">
                        Admin Dashboard 🎛️
                    </h1>
                    <p className="text-base sm:text-lg lg:text-xl text-gray-300">
                        Create and manage prediction markets
                    </p>
                </motion.div>

                {/* Create Prediction Form */}
                <CreatePredictionForm />

                {/* Manage Markets */}
                <ManageMarkets />
            </div>
        </motion.div>
    );
};

const CreatePredictionForm = () => {
    const [selectedCategory, setSelectedCategory] = useState(null); // null = show selection, 'TWITTER' or 'INK CHAIN' = show form
    const [formData, setFormData] = useState({
        category: 'TWITTER',
        question: '',
        emoji: '🎯',
        tweetUrl: '',
        inkContractAddress: '',
        targetMetric: '',
        metricType: 'like',
        durationHours: 24,
    });
    const [creating, setCreating] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const ADMIN_SECRET = import.meta.env.VITE_ADMIN_API_SECRET;

            // Use the /api/admin/predictions endpoint (handles both categories)
            const payload = {
                category: selectedCategory,
                question: formData.question,
                emoji: formData.emoji,
                tweetUrl: formData.tweetUrl,
                inkContractAddress: formData.inkContractAddress,
                targetMetric: parseInt(formData.targetMetric),
                metricType: formData.metricType,
                durationHours: parseInt(formData.durationHours)
            };

            const response = await axios.post(`${API_URL}/api/admin/predictions`, payload, {
                headers: {
                    'Authorization': `Bearer ${ADMIN_SECRET}`
                }
            });

            if (response.data.success) {
                toast.success(`✅ Prediction created! Market ID: ${response.data.marketId}`);

                // Reset form and go back to category selection
                setSelectedCategory(null);
                setFormData({
                    category: 'TWITTER',
                    question: '',
                    emoji: '🎯',
                    tweetUrl: '',
                    inkContractAddress: '',
                    targetMetric: '',
                    metricType: selectedCategory === 'TWITTER' ? 'like' : 'transactions',
                    durationHours: 24,
                });
            }
        } catch (error) {
            console.error('Error creating prediction:', error);
            toast.error(error.response?.data?.error || 'Failed to create prediction');
        } finally {
            setCreating(false);
        }
    };

    // Step 1: Category Selection
    if (!selectedCategory) {
        return (
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="card p-4 sm:p-6 lg:p-8"
            >
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
                    ➕ Create New Prediction
                </h2>
                <p className="text-gray-400 text-center mb-8">Choose prediction type</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory('TWITTER')}
                        className="card p-8 border-2 border-transparent hover:border-neon-purple transition-all"
                    >
                        <div className="text-6xl mb-4">🐦</div>
                        <h3 className="text-xl font-bold mb-2">Twitter Prediction</h3>
                        <p className="text-sm text-gray-400">Create predictions based on tweet metrics</p>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory('INK CHAIN')}
                        className="card p-8 border-2 border-transparent hover:border-neon-purple transition-all"
                    >
                        <div className="text-6xl mb-4">⛓️</div>
                        <h3 className="text-xl font-bold mb-2">Ink Chain Prediction</h3>
                        <p className="text-sm text-gray-400">Create predictions based on blockchain metrics</p>
                    </motion.button>
                </div>
            </motion.div>
        );
    }

    // Step 2: Show Form Based on Category
    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="card p-4 sm:p-6 lg:p-8"
        >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center space-x-2">
                    <span>{selectedCategory === 'TWITTER' ? '🐦' : '⛓️'}</span>
                    <span>{selectedCategory} Prediction</span>
                </h2>
                <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                    ← Back
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Question */}
                <div>
                    <label className="block text-sm font-medium mb-2">Question</label>
                    <textarea
                        value={formData.question}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        placeholder={selectedCategory === 'TWITTER' ? "Will Vitalik's tweet reach 10K likes?" : "Will Ink Chain have 70000 active wallets?"}
                        className="w-full input-purple rounded-lg px-3 py-2.5 text-sm sm:text-base resize-none"
                        rows="2"
                        required
                    />
                </div>

                {/* Emoji */}
                <div>
                    <label className="block text-sm font-medium mb-2">Emoji</label>
                    <input
                        type="text"
                        value={formData.emoji}
                        onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                        placeholder="🎯"
                        className="w-full input-purple rounded-lg px-3 py-2.5 text-sm sm:text-base"
                        maxLength={2}
                    />
                </div>

                {/* Twitter-specific fields */}
                {selectedCategory === 'TWITTER' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">Tweet URL</label>
                            <input
                                type="url"
                                value={formData.tweetUrl}
                                onChange={(e) => setFormData({ ...formData, tweetUrl: e.target.value })}
                                placeholder="https://twitter.com/user/status/123..."
                                className="w-full input-purple rounded-lg px-3 py-2.5 text-sm sm:text-base"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Metric Type</label>
                            <select
                                value={formData.metricType}
                                onChange={(e) => setFormData({ ...formData, metricType: e.target.value })}
                                className="w-full input-purple rounded-lg px-3 py-2.5 text-sm sm:text-base"
                            >
                                <option value="like">Likes</option>
                                <option value="retweet">Retweets</option>
                                <option value="reply">Replies</option>
                                <option value="view">Views</option>
                                <option value="quote">Quotes</option>
                            </select>
                        </div>
                    </>
                )}

                {/* Ink Chain-specific fields */}
                {selectedCategory === 'INK CHAIN' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">Contract Address (Optional)</label>
                            <input
                                type="text"
                                value={formData.inkContractAddress}
                                onChange={(e) => setFormData({ ...formData, inkContractAddress: e.target.value })}
                                placeholder="0x..."
                                className="w-full input-purple rounded-lg px-3 py-2.5 text-sm sm:text-base"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Metric Type</label>
                            <select
                                value={formData.metricType}
                                onChange={(e) => setFormData({ ...formData, metricType: e.target.value })}
                                className="w-full input-purple rounded-lg px-3 py-2.5 text-sm sm:text-base"
                            >
                                <option value="transactions">Total Transactions</option>
                                <option value="tvl">TVL (USD)</option>
                                <option value="gas_price">Gas Price</option>
                                <option value="block_number">Block Number</option>
                                <option value="users">Active Users</option>
                                <option value="active_wallets">Active Wallets</option>
                                <option value="contracts">Contracts</option>
                                <option value="deployed_contracts">Deployed Contracts</option>
                            </select>
                        </div>
                    </>
                )}

                {/* Target Metric */}
                <div>
                    <label className="block text-sm font-medium mb-2">Target Value</label>
                    <input
                        type="number"
                        value={formData.targetMetric}
                        onChange={(e) => setFormData({ ...formData, targetMetric: e.target.value })}
                        placeholder="10000"
                        className="w-full input-purple rounded-lg px-3 py-2.5 text-sm sm:text-base"
                        required
                    />
                </div>

                {/* Duration */}
                <div>
                    <label className="block text-sm font-medium mb-2">Duration (hours)</label>
                    <input
                        type="number"
                        value={formData.durationHours}
                        onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
                        placeholder="24"
                        className="w-full input-purple rounded-lg px-3 py-2.5 text-sm sm:text-base"
                        required
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={creating}
                    className="w-full btn-primary py-3 sm:py-4 text-base sm:text-lg touch-manipulation"
                >
                    {creating ? 'Creating...' : '✨ Create Prediction'}
                </button>
            </form>
        </motion.div>
    );
};

import ManualResolveButton from '../components/ManualResolveButton';
import { useEffect } from 'react';

const ManageMarkets = () => {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMarkets = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const ADMIN_SECRET = import.meta.env.VITE_ADMIN_API_SECRET;
            // Use admin endpoint to get all unresolved markets including expired ones
            const response = await axios.get(`${API_URL}/api/admin/markets`, {
                headers: {
                    'Authorization': `Bearer ${ADMIN_SECRET}`
                }
            });
            setMarkets(response.data.markets);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching markets:', error);
            toast.error('Failed to load markets');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarkets();
    }, []);

    if (loading) return <div className="text-center py-8">Loading markets...</div>;

    // Separate markets into active and expired
    const activeMarkets = markets.filter(m => !m.expired);
    const expiredMarkets = markets.filter(m => m.expired);

    return (
        <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="card p-4 sm:p-6 lg:p-8 mt-8"
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center space-x-2">
                    <span>🛠️</span>
                    <span>Manage Markets</span>
                </h2>
                <button onClick={fetchMarkets} className="text-sm text-neon-purple hover:text-white transition-colors">
                    🔄 Refresh
                </button>
            </div>

            {/* Expired Unresolved Markets Section */}
            {expiredMarkets.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg font-bold text-red-400">⚠️ Expired & Unresolved</span>
                        <span className="text-xs bg-red-900/30 text-red-300 px-2 py-1 rounded">
                            {expiredMarkets.length} need resolution
                        </span>
                    </div>
                    <div className="space-y-4">
                        {expiredMarkets.map((market) => (
                            <div key={market.id} className="glass p-4 rounded-lg border-2 border-red-500/50 bg-red-900/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono bg-purple-900/50 px-2 py-0.5 rounded text-purple-200">
                                            ID: {market.id}
                                        </span>
                                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-900 text-red-300">
                                            EXPIRED
                                        </span>
                                        {market.category && (
                                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-900 text-purple-300">
                                                {market.category}
                                            </span>
                                        )}
                                    </div>
                                    {market.question && (
                                        <div className="font-bold text-white mb-1">
                                            {market.emoji} {market.question}
                                        </div>
                                    )}
                                    <div className="text-sm text-gray-300 mb-1">
                                        Target: {market.targetMetric} {market.metricType}
                                        {market.currentMetric !== undefined && (
                                            <span className="ml-2 text-gray-400">
                                                (Current: {market.currentMetric})
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 truncate max-w-md">
                                        {market.tweetId && `Tweet ID: ${market.tweetId}`}
                                        {market.tweetUrl && (
                                            <a href={market.tweetUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-neon-purple hover:underline">
                                                View Tweet
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <ManualResolveButton
                                    marketId={market.id}
                                    onResolved={fetchMarkets}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Markets Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg font-bold text-gray-300">Active Markets</span>
                    <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                        {activeMarkets.length}
                    </span>
                </div>
                <div className="space-y-4">
                    {activeMarkets.length === 0 ? (
                        <div className="text-gray-400 text-center py-4">No active markets found</div>
                    ) : (
                        activeMarkets.map((market) => (
                            <div key={market.id} className="glass p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono bg-purple-900/50 px-2 py-0.5 rounded text-purple-200">
                                            ID: {market.id}
                                        </span>
                                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-900 text-blue-300">
                                            ACTIVE
                                        </span>
                                        {market.category && (
                                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-900 text-purple-300">
                                                {market.category}
                                            </span>
                                        )}
                                    </div>
                                    {market.question && (
                                        <div className="font-bold text-white mb-1">
                                            {market.emoji} {market.question}
                                        </div>
                                    )}
                                    <div className="text-sm text-gray-300 mb-1">
                                        Target: {market.targetMetric} {market.metricType}
                                        {market.currentMetric !== undefined && (
                                            <span className="ml-2 text-gray-400">
                                                (Current: {market.currentMetric})
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 truncate max-w-md">
                                        {market.tweetId && `Tweet ID: ${market.tweetId}`}
                                        {market.tweetUrl && (
                                            <a href={market.tweetUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-neon-purple hover:underline">
                                                View Tweet
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <ManualResolveButton
                                    marketId={market.id}
                                    onResolved={fetchMarkets}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const ConnectWalletPrompt = () => (
    <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
        >
            <div className="text-6xl sm:text-8xl mb-4">👛</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gradient-cyber mb-4">
                Connect Your Wallet
            </h2>
            <p className="text-gray-400 text-base sm:text-lg">
                Connect your wallet to access the admin dashboard
            </p>
        </motion.div>
    </div>
);

const UnauthorizedAccess = () => (
    <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
        >
            <div className="text-6xl sm:text-8xl mb-4">🚫</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-red-500 mb-4">
                Access Denied
            </h2>
            <p className="text-gray-400 text-base sm:text-lg mb-8">
                Only admin wallet can access this page
            </p>
            <Link to="/">
                <button className="btn-primary px-6 py-3">
                    Back to Home
                </button>
            </Link>
        </motion.div>
    </div>
);

export default Admin;
