// CategoryFilter.jsx
import { motion } from 'framer-motion';

const CategoryFilter = ({ selected, onChange }) => {
  const categories = [
    { id: 'all', label: 'All Markets', icon: '📋' },
    { id: 'twitter', label: 'Twitter', icon: '🐦' },
    { id: 'ink', label: 'Ink Chain', icon: '⛓️' },
  ];

  return (
    <div className="flex gap-2">
      {categories.map((cat) => (
        <motion.button
          key={cat.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(cat.id)}
          className={`filter-btn ${selected === cat.id ? 'active' : ''}`}
        >
          <span className="mr-2">{cat.icon}</span>
          {cat.label}
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryFilter;
