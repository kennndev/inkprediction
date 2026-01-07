import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ADMIN_WALLET = import.meta.env.VITE_ADMIN_WALLET || '';

const Admin = () => {
    const { address, isConnected } = useAccount();
    const [isAdmin, setIsAdmin] = useState(false);
    const [markets, setMarkets] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [activeTab, setActiveTab] = useState('proposals'); // 'proposals', 'markets', 'create'

    const [loading, setLoading] = useState(true);

    // Create Market Form State
    const [formData, setFormData] = useState({
        tweetId: '',
        targetMetric: '',
        metricType: 'like',
        duration: 24,
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isConnected && address) {
            const adminStatus = address.toLowerCase() === ADMIN_WALLET.toLowerCase();
            setIsAdmin(adminStatus);

            if (adminStatus) {
                fetchData();
            }
        }
    }, [address, isConnected]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

            // Fetch markets and proposals in parallel
            const [marketsRes, proposalsRes] = await Promise.all([
                axios.get(`${API_URL}/api/admin/markets`),
                axios.get(`${API_URL}/api/admin/proposals`)
            ]);

            if (marketsRes.data.success) {
                setMarkets(marketsRes.data.markets);
            }

            if (proposalsRes.data.success) {
                setProposals(proposalsRes.data.proposals);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveProposal = async (proposalId) => {
        try {
            const loadingToast = toast.loading('Approving & Deploying Market...');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

            const response = await axios.post(`${API_URL}/api/admin/proposals/approve`, {
                proposalId
            });

            if (response.data.success) {
                toast.success('✅ Market Approved & Deployed!', { id: loadingToast });
                fetchData(); // Refresh list
            }
        } catch (error) {
            console.error('Error approving proposal:', error);
            toast.error(error.response?.data?.error || 'Failed to approve proposal');
        }
    };

    const handleRejectProposal = async (proposalId) => {
        if (!window.confirm('Are you sure you want to reject this proposal?')) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

            const response = await axios.post(`${API_URL}/api/admin/proposals/reject`, {
                proposalId
            });

            if (response.data.success) {
                toast.success('Proposal Rejected');
                fetchData(); // Refresh list
            }
        } catch (error) {
            console.error('Error rejecting proposal:', error);
            toast.error('Failed to reject proposal');
        }
    };

    // ... Existing handlers (handleResolve, handleCreateSubmit) ...
    const handleResolve = async (marketId) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await axios.post(`${API_URL}/api/admin/resolve-market`, {
                marketId
            });

            if (response.data.success) {
                toast.success(`Market resolved: ${response.data.outcome ? 'YES' : 'NO'}`);
                fetchData();
            }
        } catch (error) {
            console.error('Error resolving market:', error);
            toast.error(error.response?.data?.error || 'Failed to resolve market');
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            if (!formData.tweetId || !formData.targetMetric) {
                toast.error('Please fill required fields');
                return;
            }

            const response = await axios.post(`${API_URL}/api/admin/create-market`, {
                tweetId: formData.tweetId,
                targetMetric: parseInt(formData.targetMetric),
                metricType: formData.metricType,
                durationHours: parseInt(formData.duration),
                description: formData.description
            });

            if (response.data.success) {
                toast.success('Market Created Successfully!');
                setFormData({ tweetId: '', targetMetric: '', metricType: 'like', duration: 24, description: '' });
                fetchData();
                setActiveTab('markets');
            }
        } catch (error) {
            console.error('Error creating market:', error);
            toast.error(error.response?.data?.error || 'Failed to create market');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isConnected || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
                    <p className="text-gray-400">You must be an admin to view this page.</p>
                    <Link to="/" className="btn-primary mt-6 inline-block">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-display font-bold text-gradient-cyber">
                        Admin Dashboard 🎛️
                    </h1>
                    <button onClick={fetchData} className="btn-secondary text-sm">
                        🔄 Refresh Data
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveTab('proposals')}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'proposals'
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black'
                            : 'glass text-gray-400 hover:text-white'
                            }`}
                    >
                        📋 Proposals {proposals.length > 0 && <span className="ml-2 bg-black/20 px-2 rounded-full">{proposals.length}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('markets')}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'markets'
                            ? 'bg-purple-600 text-white'
                            : 'glass text-gray-400 hover:text-white'
                            }`}
                    >
                        📊 Active Markets
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'create'
                            ? 'bg-blue-600 text-white'
                            : 'glass text-gray-400 hover:text-white'
                            }`}
                    >
                        ➕ Manual Create
                    </button>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-center py-20"
                        >
                            <div className="spinner w-12 h-12"></div>
                        </motion.div>
                    ) : (
                        <>
                            {/* Proposals Tab */}
                            {activeTab === 'proposals' && (
                                <motion.div
                                    key="proposals"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    {proposals.length === 0 ? (
                                        <div className="text-center py-20 glass rounded-2xl">
                                            <div className="text-6xl mb-4">😴</div>
                                            <h3 className="text-xl font-bold text-gray-300">No Pending Proposals</h3>
                                            <p className="text-gray-500">All caught up! Check back later.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {proposals.map((proposal) => (
                                                <div key={proposal.id} className="glass-strong p-6 rounded-2xl border border-yellow-500/20 hover:border-yellow-500/50 transition-all">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="text-4xl">{proposal.emoji}</span>
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                            PENDING
                                                        </span>
                                                    </div>

                                                    <h3 className="text-lg font-bold mb-3 line-clamp-2">{proposal.question}</h3>

                                                    <div className="space-y-2 mb-6 text-sm text-gray-400">
                                                        <div className="flex justify-between">
                                                            <span>Target:</span>
                                                            <span className="text-white font-mono">
                                                                {proposal.target_metric.toLocaleString()} {proposal.metric_type}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Duration:</span>
                                                            <span className="text-white">{proposal.duration_hours} Hours</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Proposer:</span>
                                                            <span className="text-white font-mono" title={proposal.created_by}>
                                                                {proposal.created_by.slice(0, 6)}...{proposal.created_by.slice(-4)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <button
                                                            onClick={() => handleRejectProposal(proposal.id)}
                                                            className="px-4 py-2 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-bold"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveProposal(proposal.id)}
                                                            className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-500 transition-colors text-sm font-bold shadow-lg shadow-green-900/20"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Active Markets Tab */}
                            {activeTab === 'markets' && (
                                <motion.div
                                    key="markets"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    {markets.map((market) => {
                                        const totalPool = parseFloat(market.yesPool || 0) + parseFloat(market.noPool || 0);
                                        const hasBets = totalPool > 0;

                                        return (
                                            <div key={market.id} className="glass p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-3xl">{market.emoji}</span>
                                                        <h3 className="font-bold text-lg">{market.question}</h3>
                                                    </div>
                                                    <div className="flex gap-4 text-sm text-gray-400">
                                                        <span>ID: #{market.id}</span>
                                                        <span>Target: {market.targetMetric}</span>
                                                        <span className={market.expired ? "text-red-400" : "text-green-400"}>
                                                            {market.expired ? "Expired" : "Active"}
                                                        </span>
                                                        <span className={hasBets ? "text-blue-400" : "text-yellow-400"}>
                                                            Pool: ${totalPool.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {!market.resolved && (
                                                        <button
                                                            onClick={() => handleResolve(market.id)}
                                                            disabled={!hasBets}
                                                            className={`px-4 py-2 rounded-lg font-bold transition-all ${hasBets
                                                                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                                }`}
                                                            title={!hasBets ? "Cannot resolve market with no bets" : "Resolve this market"}
                                                        >
                                                            {hasBets ? 'Force Resolve' : 'No Bets Yet'}
                                                        </button>
                                                    )}
                                                    {market.resolved && (
                                                        <span className="px-4 py-2 bg-gray-700 rounded-lg text-gray-400 font-bold">
                                                            Resolved
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}}
                                </motion.div>
                            )}

                            {/* Manual Create Tab */}
                            {activeTab === 'create' && (
                                <motion.div
                                    key="create"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="max-w-2xl mx-auto glass p-8 rounded-3xl"
                                >
                                    <h2 className="text-2xl font-bold mb-6">Create Custom Market</h2>
                                    <form onSubmit={handleCreateSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-gray-400 mb-2">Tweet ID</label>
                                            <input
                                                type="text"
                                                className="w-full input-purple p-3 rounded-xl"
                                                value={formData.tweetId}
                                                onChange={(e) => setFormData({ ...formData, tweetId: e.target.value })}
                                                placeholder="1234567890"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-400 mb-2">Target Metric</label>
                                                <input
                                                    type="number"
                                                    className="w-full input-purple p-3 rounded-xl"
                                                    value={formData.targetMetric}
                                                    onChange={(e) => setFormData({ ...formData, targetMetric: e.target.value })}
                                                    placeholder="1000"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 mb-2">Metric Type</label>
                                                <select
                                                    className="w-full input-purple p-3 rounded-xl"
                                                    value={formData.metricType}
                                                    onChange={(e) => setFormData({ ...formData, metricType: e.target.value })}
                                                >
                                                    <option value="like">Likes</option>
                                                    <option value="retweet">Retweets</option>
                                                    <option value="view">Views</option>
                                                    <option value="reply">Replies</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-gray-400 mb-2">Duration (Hours)</label>
                                            <input
                                                type="number"
                                                className="w-full input-purple p-3 rounded-xl"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-400 mb-2">Custom Description (Optional)</label>
                                            <input
                                                type="text"
                                                className="w-full input-purple p-3 rounded-xl"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Will this tweet reach..."
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full btn-primary py-3 font-bold"
                                        >
                                            {isSubmitting ? 'Creating...' : 'Create Market'}
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Admin;
