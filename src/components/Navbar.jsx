import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

const ADMIN_WALLET = import.meta.env.VITE_ADMIN_WALLET || '';

const Navbar = () => {
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const [scrolled, setScrolled] = useState(false);
  const [hasUnclaimedReward, setHasUnclaimedReward] = useState(true);

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
    { path: '/achievements', label: 'Achievements', icon: '🏅' },
    { path: '/daily-rewards', label: 'Daily', icon: '🎁', hasNotification: hasUnclaimedReward },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', label: 'Admin', icon: '🎛️' });
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-strong shadow-2xl' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.3 }}
              className="w-12 h-12"
            >
              <img src="/logo.png" alt="Boink Prediction Logo" className="w-full h-full object-contain" />
            </motion.div>
            <motion.span
              className="text-xl sm:text-2xl font-display font-bold text-gradient-cyber hidden sm:block"
              whileHover={{ scale: 1.05 }}
            >
              Boink Prediction
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg glow-purple'
                        : 'glass hover:glass-strong'
                    }`}
                  >
                    <span className="mr-1">{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                    {item.hasNotification && (
                      <span className="notification-badge">!</span>
                    )}
                  </motion.div>
                </Link>
              );
            })}

            {/* Create Market Button */}
            <Link to="/create">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-full font-medium bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
              >
                <span className="mr-1">➕</span>
                <span className="text-sm">Create</span>
              </motion.div>
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
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
            <div className="lg:hidden">
              <MobileMenu navItems={navItems} />
            </div>
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
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg glass-strong"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 glass-strong z-50 p-6"
            >
              <div className="flex flex-col space-y-4 mt-20">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)}>
                      <motion.div
                        whileTap={{ scale: 0.95 }}
                        className={`relative p-4 rounded-2xl font-medium transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white'
                            : 'glass hover:glass-strong'
                        }`}
                      >
                        <span className="mr-3 text-2xl">{item.icon}</span>
                        {item.label}
                        {item.hasNotification && (
                          <span className="notification-badge">!</span>
                        )}
                      </motion.div>
                    </Link>
                  );
                })}

                <Link to="/create" onClick={() => setIsOpen(false)}>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="p-4 rounded-2xl font-medium bg-gradient-to-r from-yellow-500 to-orange-500 text-black"
                  >
                    <span className="mr-3 text-2xl">➕</span>
                    Create Market
                  </motion.div>
                </Link>

                <div className="pt-4 border-t border-white/10">
                  <ConnectButton />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
