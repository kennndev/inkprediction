import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import axios from 'axios';
import toast from 'react-hot-toast';

const CommentsSection = ({ marketId }) => {
  const { address, isConnected } = useAccount();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [marketId]);

  const fetchComments = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${API_URL}/api/market/${marketId}/comments`);
      setComments(response.data.comments || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setLoading(false);
      // Mock data for demo
      setComments([
        { id: 1, user: '0x1a2b...3c4d', content: 'This one is definitely going to hit! 🚀', timestamp: Date.now() - 3600000, position: true },
        { id: 2, user: '0x5e6f...7g8h', content: 'I think NO is the safer bet here', timestamp: Date.now() - 7200000, position: false },
        { id: 3, user: '0x9i0j...1k2l', content: 'Interesting market! Let\'s see how it plays out', timestamp: Date.now() - 10800000, position: null },
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      toast.error('Please connect your wallet to comment');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await axios.post(`${API_URL}/api/market/${marketId}/comments`, {
        userAddress: address,
        content: newComment,
      });

      // Add comment locally
      const newCommentObj = {
        id: Date.now(),
        user: `${address.slice(0, 6)}...${address.slice(-4)}`,
        content: newComment,
        timestamp: Date.now(),
        position: null,
      };
      setComments([newCommentObj, ...comments]);
      setNewComment('');
      toast.success('Comment posted! +5 XP');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isConnected ? "Share your prediction thoughts..." : "Connect wallet to comment"}
          disabled={!isConnected}
          className="comment-input h-24"
          maxLength={500}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">{newComment.length}/500</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!isConnected || submitting || !newComment.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </motion.button>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="comment-card">
              <div className="skeleton h-4 w-24 mb-2" />
              <div className="skeleton h-12 w-full" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <span className="text-4xl">💬</span>
          <p className="mt-2">No comments yet. Be the first!</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="comment-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-purple-400">{comment.user}</span>
                    {comment.position !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        comment.position
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {comment.position ? 'YES' : 'NO'} voter
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {getTimeAgo(comment.timestamp)}
                  </span>
                </div>
                <p className="text-gray-300">{comment.content}</p>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

const getTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default CommentsSection;
