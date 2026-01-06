import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const MARKET_TEMPLATES = [
  {
    category: 'TWITTER',
    icon: '🐦',
    templates: [
      { question: 'Will this tweet reach {target} likes?', metricType: 'like' },
      { question: 'Will this tweet get {target} retweets?', metricType: 'retweet' },
      { question: 'Will this tweet reach {target} views?', metricType: 'view' },
      { question: 'Will this tweet get {target} replies?', metricType: 'reply' },
    ]
  },
  {
    category: 'INK CHAIN',
    icon: '⛓️',
    templates: [
      { question: 'Will Ink Chain reach {target} transactions?', metricType: 'transactions' },
      { question: 'Will Ink Chain hit block {target}?', metricType: 'block_number' },
      { question: 'Will gas price drop below {target} gwei?', metricType: 'gas_price' },
      { question: 'Will Ink Chain have {target} active wallets?', metricType: 'active_wallets' },
    ]
  }
];

const DURATION_OPTIONS = [
  { label: '6 Hours', value: 6 },
  { label: '12 Hours', value: 12 },
  { label: '24 Hours', value: 24 },
  { label: '48 Hours', value: 48 },
  { label: '7 Days', value: 168 },
];

const CreateMarket = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(null);
  const [formData, setFormData] = useState({
    tweetId: '',
    tweetUrl: '',
    question: '',
    targetMetric: '',
    metricType: 'like',
    duration: 24,
    emoji: '🎯',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setFormData(prev => ({
      ...prev,
      metricType: cat === 'TWITTER' ? 'like' : 'transactions',
    }));
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-extract tweet ID from URL
    if (name === 'tweetUrl' && value.includes('twitter.com') || value.includes('x.com')) {
      const match = value.match(/status\/(\d+)/);
      if (match) {
        setFormData(prev => ({ ...prev, tweetId: match[1] }));
      }
    }
  };

  const handleTemplateSelect = (template) => {
    const question = template.question.replace('{target}', formData.targetMetric || '[target]');
    setFormData(prev => ({
      ...prev,
      question,
      metricType: template.metricType,
    }));
  };

  const validateForm = () => {
    if (category === 'TWITTER' && !formData.tweetId) {
      toast.error('Please enter a valid tweet URL');
      return false;
    }
    if (!formData.question.trim()) {
      toast.error('Please enter a question');
      return false;
    }
    if (!formData.targetMetric || parseInt(formData.targetMetric) <= 0) {
      toast.error('Please enter a valid target metric');
      return false;
    }
    return true;
  };

  const handlePreview = () => {
    if (!validateForm()) return;

    setPreview({
      ...formData,
      category,
      deadline: new Date(Date.now() + formData.duration * 60 * 60 * 1000).toISOString(),
    });
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsSubmitting(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const payload = {
        creatorAddress: address,
        category: category,
        tweetId: category === 'TWITTER' ? formData.tweetId : `ink_${Date.now()}`,
        tweetUrl: formData.tweetUrl || null,
        question: formData.question,
        targetMetric: parseInt(formData.targetMetric),
        metricType: formData.metricType,
        durationHours: formData.duration,
        emoji: formData.emoji,
      };

      const response = await axios.post(`${API_URL}/api/markets/propose`, payload);

      if (response.data.success) {
        toast.success('🎉 Market proposal submitted! Pending admin approval.');
        navigate('/');
      } else {
        toast.error(response.data.error || 'Failed to submit market');
      }
    } catch (error) {
      console.error('Error submitting market:', error);
      toast.error(error.response?.data?.error || 'Failed to submit market');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-4">🔒</div>
          <h2 className="text-3xl font-bold text-gradient-cyber mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 text-lg">
            Connect your wallet to create a market
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <Link to="/">
            <button className="arcade-btn purple-box px-4 py-2 mb-4">
              ◀ BACK TO MARKETS
            </button>
          </Link>
          <h1 className="text-display font-display font-bold text-gradient-cyber mb-4">
            Create Market 🎯
          </h1>
          <p className="text-xl text-gray-300">
            Propose a new prediction market for the community
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-8"
        >
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s
                    ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {s}
              </div>
              <span className={`ml-2 hidden sm:block ${step >= s ? 'text-white' : 'text-gray-500'}`}>
                {s === 1 && 'Category'}
                {s === 2 && 'Details'}
                {s === 3 && 'Review'}
              </span>
              {s < 3 && (
                <div className={`w-20 h-1 mx-4 ${step > s ? 'bg-purple-500' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold mb-4">Select Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MARKET_TEMPLATES.map((cat) => (
                <motion.button
                  key={cat.category}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCategorySelect(cat.category)}
                  className="card p-8 text-left hover:border-purple-500/50 transition-all"
                >
                  <div className="text-5xl mb-4">{cat.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{cat.category}</h3>
                  <p className="text-gray-400 text-sm">
                    {cat.category === 'TWITTER'
                      ? 'Predict tweet engagement metrics'
                      : 'Predict Ink Chain network metrics'
                    }
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Market Details */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Market Details</h2>
              <button
                onClick={() => setStep(1)}
                className="text-purple-400 hover:text-purple-300"
              >
                ← Back
              </button>
            </div>

            {/* Tweet URL (for Twitter category) */}
            {category === 'TWITTER' && (
              <div className="card p-6">
                <label className="block text-sm text-gray-400 mb-2">
                  Tweet URL *
                </label>
                <input
                  type="text"
                  name="tweetUrl"
                  value={formData.tweetUrl}
                  onChange={handleInputChange}
                  placeholder="https://twitter.com/user/status/123456789"
                  className="w-full input-purple p-4 rounded-xl"
                />
                {formData.tweetId && (
                  <div className="mt-2 text-sm text-green-400">
                    ✓ Tweet ID detected: {formData.tweetId}
                  </div>
                )}
              </div>
            )}

            {/* Question Templates */}
            <div className="card p-6">
              <label className="block text-sm text-gray-400 mb-4">
                Quick Templates
              </label>
              <div className="flex flex-wrap gap-2">
                {MARKET_TEMPLATES.find(t => t.category === category)?.templates.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTemplateSelect(template)}
                    className="purple-box px-3 py-2 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
                  >
                    {template.metricType}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Question */}
            <div className="card p-6">
              <label className="block text-sm text-gray-400 mb-2">
                Question *
              </label>
              <input
                type="text"
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                placeholder="Will this tweet reach 10,000 likes?"
                className="w-full input-purple p-4 rounded-xl"
              />
            </div>

            {/* Target Metric */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6">
                <label className="block text-sm text-gray-400 mb-2">
                  Target Value *
                </label>
                <input
                  type="number"
                  name="targetMetric"
                  value={formData.targetMetric}
                  onChange={handleInputChange}
                  placeholder="10000"
                  className="w-full input-purple p-4 rounded-xl"
                />
              </div>

              <div className="card p-6">
                <label className="block text-sm text-gray-400 mb-2">
                  Metric Type
                </label>
                <select
                  name="metricType"
                  value={formData.metricType}
                  onChange={handleInputChange}
                  className="w-full input-purple p-4 rounded-xl"
                >
                  {category === 'TWITTER' ? (
                    <>
                      <option value="like">Likes</option>
                      <option value="retweet">Retweets</option>
                      <option value="view">Views</option>
                      <option value="reply">Replies</option>
                    </>
                  ) : (
                    <>
                      <option value="transactions">Transactions</option>
                      <option value="block_number">Block Number</option>
                      <option value="gas_price">Gas Price (Gwei)</option>
                      <option value="active_wallets">Active Wallets</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Duration */}
            <div className="card p-6">
              <label className="block text-sm text-gray-400 mb-4">
                Market Duration
              </label>
              <div className="flex flex-wrap gap-3">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFormData(prev => ({ ...prev, duration: opt.value }))}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      formData.duration === opt.value
                        ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white'
                        : 'purple-box hover:bg-purple-500/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji Picker */}
            <div className="card p-6">
              <label className="block text-sm text-gray-400 mb-4">
                Market Emoji
              </label>
              <div className="flex flex-wrap gap-3">
                {['🎯', '🚀', '🔥', '💎', '🌟', '⚡', '🎮', '🏆', '💰', '🎪'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                    className={`text-3xl p-2 rounded-lg transition-all ${
                      formData.emoji === emoji
                        ? 'bg-purple-500/30 ring-2 ring-purple-500'
                        : 'hover:bg-purple-500/20'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handlePreview}
              className="w-full btn-primary py-4 text-lg font-bold"
            >
              Preview Market →
            </button>
          </motion.div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && preview && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Review & Submit</h2>
              <button
                onClick={() => setStep(2)}
                className="text-purple-400 hover:text-purple-300"
              >
                ← Edit
              </button>
            </div>

            {/* Preview Card */}
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-5xl">{preview.emoji}</span>
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    preview.category === 'INK CHAIN'
                      ? 'bg-purple-900/50 text-purple-300'
                      : 'bg-blue-900/50 text-blue-300'
                  }`}>
                    {preview.category}
                  </span>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-4">{preview.question}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="purple-box p-4 rounded-xl">
                  <div className="text-sm text-gray-400">Target</div>
                  <div className="text-xl font-bold text-gradient-pink">
                    {parseInt(preview.targetMetric).toLocaleString()} {preview.metricType}s
                  </div>
                </div>
                <div className="purple-box p-4 rounded-xl">
                  <div className="text-sm text-gray-400">Duration</div>
                  <div className="text-xl font-bold text-gradient-purple">
                    {preview.duration} hours
                  </div>
                </div>
              </div>

              {preview.tweetId && (
                <div className="mt-4 text-sm text-gray-400">
                  Tweet ID: {preview.tweetId}
                </div>
              )}
            </div>

            {/* Info Notice */}
            <div className="card p-4 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <h4 className="font-bold text-yellow-400">Important</h4>
                  <p className="text-gray-300 text-sm">
                    Your market proposal will be reviewed by admins before going live.
                    You'll earn <span className="text-gradient-gold">+100 XP</span> when your market is approved!
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full btn-gold py-4 text-lg font-bold disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner w-5 h-5" />
                  Submitting...
                </span>
              ) : (
                'Submit Market Proposal 🚀'
              )}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CreateMarket;
