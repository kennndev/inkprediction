import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

const ADMIN_WALLET = '0x21A5625Fc19469c11555B5607eDB2B97324e7D82';

const Navbar = () => {
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const [scrolled, setScrolled] = useState(false);

  const isAdmin = isConnected && address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'Markets', icon: '🎯' },
    { path: '/portfolio', label: 'Portfolio', icon: '💼' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  ];

  // Add admin link if wallet is admin
  if (isAdmin) {
    navItems.push({ path: '/admin', label: 'Admin', icon: '🎛️' });
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass-strong shadow-2xl' : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="text-3xl"
            >
              📈
            </motion.div>
            <motion.span
              className="text-2xl font-display font-bold text-gradient-cyber"
              whileHover={{ scale: 1.05 }}
            >
              InkPredict
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${isActive
                      ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg glow-purple'
                      : 'glass hover:glass-strong'
                      }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Connect Wallet Button */}
          <div className="hidden md:block">
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <MobileMenu navItems={navItems} />
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

const MobileMenu = ({ navItems }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Hamburger Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg glass-strong"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </motion.button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-80 glass-strong z-50 p-6"
      >
        <div className="flex flex-col space-y-4 mt-20">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-2xl font-medium transition-all ${isActive
                    ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white'
                    : 'glass hover:glass-strong'
                    }`}
                >
                  <span className="mr-3 text-2xl">{item.icon}</span>
                  {item.label}
                </motion.div>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-white/10">
            <ConnectButton />
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Navbar;
