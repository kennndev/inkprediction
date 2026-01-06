import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ManualResolveButton = ({ marketId, onResolved }) => {
    const [loading, setLoading] = useState(false);

    const handleResolve = async () => {
        if (!confirm(`Are you sure you want to resolve market #${marketId} now?`)) {
            return;
        }

        setLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const ADMIN_SECRET = import.meta.env.VITE_ADMIN_API_SECRET;
            const response = await axios.post(`${API_URL}/api/admin/resolve-market`, {
                marketId: marketId
            }, {
                headers: {
                    'Authorization': `Bearer ${ADMIN_SECRET}`
                }
            });

            if (response.data.success) {
                const { outcome, actualMetric, targetMetric, transactionHash } = response.data;

                toast.success(
                    `Market resolved! ${outcome ? 'YES' : 'NO'} won (${actualMetric}/${targetMetric})`,
                    { duration: 5000 }
                );

                console.log('Resolution TX:', transactionHash);

                if (onResolved) {
                    onResolved(response.data);
                }
            }
        } catch (error) {
            console.error('Resolution error:', error);
            toast.error(error.response?.data?.error || 'Failed to resolve market');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleResolve}
            disabled={loading}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
            <span>{loading ? '⏳' : '🔮'}</span>
            <span>{loading ? 'Resolving...' : 'Resolve Now'}</span>
        </button>
    );
};

export default ManualResolveButton;
