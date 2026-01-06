import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const INK_TEMPLATES = [
  { question: 'Will Ink Chain reach {target} transactions?', metricType: 'transactions' },
  { question: 'Will Ink Chain hit block {target}?', metricType: 'block_number' },
  { question: 'Will gas price drop below {target} gwei?', metricType: 'gas_price' },
  { question: 'Will Ink Chain have {target} active wallets?', metricType: 'active_wallets' },
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
  const [formData, setFormData] = useState({
    question: '',
    targetMetric: '',
    metricType: 'transactions', // Default
    duration: 24,
    emoji: '🎯',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      category: 'INK CHAIN',
      deadline: new Date(Date.now() + formData.duration * 60 * 60 * 1000).toISOString(),
    });
    setStep(2);
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
        category: 'INK CHAIN',
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
            Connect your wallet to propose a market
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
            Propose Market 💡
          </h1>
          <p className="text-xl text-gray-300">
            Propose a new Ink Chain prediction market for the community
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-8"
        >
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s
                    ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white'
                    : 'bg-gray-700 text-gray-400'
                  }`}
              >
                {s}
              </div>
              <span className={`ml-2 hidden sm:block ${step >= s ? 'text-white' : 'text-gray-500'}`}>
                {s === 1 && 'Details'}
                {s === 2 && 'Review'}
              </span>
              {s < 2 && (
                <div className={`w-20 h-1 mx-4 ${step > s ? 'bg-purple-500' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Step 1: Market Details */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Question Templates */}
            <div className="card p-6">
              <label className="block text-sm text-gray-400 mb-4">
                Quick Templates (Ink Chain Only)
              </label>
              <div className="flex flex-wrap gap-2">
                {INK_TEMPLATES.map((template, idx) => (
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
                placeholder="Will Ink Chain reach 1,000,000 transactions?"
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
                  placeholder="1000000"
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
                  <option value="transactions">Transactions</option>
                  <option value="block_number">Block Number</option>
                  <option value="gas_price">Gas Price (Gwei)</option>
                  <option value="active_wallets">Active Wallets</option>
                  <option value="tvl">TVL (ETH)</option>
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
                    className={`px-4 py-2 rounded-full font-medium transition-all ${formData.duration === opt.value
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
                {['🎯', '🚀', '🔥', '💎', '🌟', '⚡', '🎮', '🏆', '💰', '🎪', '⛓️', '📈'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                    className={`text-3xl p-2 rounded-lg transition-all ${formData.emoji === emoji
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
              Preview Proposal →
            </button>
          </motion.div>
        )}

        {/* Step 2: Review & Submit */}
        {step === 2 && preview && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Review Proposal</h2>
              <button
                onClick={() => setStep(1)}
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
                  <span className="px-3 py-1 rounded-full text-sm bg-purple-900/50 text-purple-300">
                    INK CHAIN
                  </span>
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-4">{preview.question}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="purple-box p-4 rounded-xl">
                  <div className="text-sm text-gray-400">Target</div>
                  <div className="text-xl font-bold text-gradient-pink">
                    {parseInt(preview.targetMetric).toLocaleString()} {preview.metricType}
                  </div>
                </div>
                <div className="purple-box p-4 rounded-xl">
                  <div className="text-sm text-gray-400">Duration</div>
                  <div className="text-xl font-bold text-gradient-purple">
                    {preview.duration} hours
                  </div>
                </div>
              </div>
            </div>

            {/* Info Notice */}
            <div className="card p-4 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <h4 className="font-bold text-yellow-400">Proposal Process</h4>
                  <p className="text-gray-300 text-sm">
                    This proposal will be submitted for admin review. If approved, the market will be deployed to the Ink Chain blockchain.
                    You'll be notified if your market is selected!
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
                  Submitting Proposal...
                </span>
              ) : (
                'Submit Proposal 🚀'
              )}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CreateMarket;
