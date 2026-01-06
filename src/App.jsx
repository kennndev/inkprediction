import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { RainbowKitProvider, getDefaultWallets, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Context Providers
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import Home from './pages/Home';
import MarketDetail from './pages/MarketDetail';
import Portfolio from './pages/Portfolio';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';
import Achievements from './pages/Achievements';
import CreateMarket from './pages/CreateMarket';
import Profile from './pages/Profile';
import DailyRewards from './pages/DailyRewards';

// Components
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
import LiveActivityFeed from './components/LiveActivityFeed';
import NotificationCenter from './components/NotificationCenter';

// Styles
import './styles/globals.css';

// Configure chains & providers
const inkChain = {
  id: 763373, // Ink Sepolia testnet
  name: 'Ink Sepolia',
  network: 'ink-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_INK_CHAIN_RPC || 'https://rpc-gel-sepolia.inkonchain.com'] },
    public: { http: [import.meta.env.VITE_INK_CHAIN_RPC || 'https://rpc-gel-sepolia.inkonchain.com'] },
  },
  blockExplorers: {
    default: { name: 'Ink Sepolia Explorer', url: 'https://explorer-sepolia.inkonchain.com' },
  },
  testnet: true,
};

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [inkChain],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'Boink Prediction',
  projectId: 'e286deb6f044672a9e94ddd202467bbd',
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        chains={chains}
        theme={darkTheme({
          accentColor: '#A855F7',
          accentColorForeground: 'white',
          borderRadius: 'large',
          fontStack: 'system',
        })}
      >
        <UserProvider>
          <NotificationProvider>
            <Router>
              <div className="relative min-h-screen cyber-grid-bg" style={{
                background: 'linear-gradient(135deg, #1a0b2e 0%, #2d1b3d 30%, #1a0b2e 60%, #2d1b3d 100%)',
                backgroundAttachment: 'fixed',
                minHeight: '100vh'
              }}>
                {/* Particle background */}
                <ParticleBackground />

                {/* Main content */}
                <div className="relative z-10">
                  <Navbar />

                  <AnimatePresence mode="wait">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/market/:id" element={<MarketDetail />} />
                      <Route path="/portfolio" element={<Portfolio />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/achievements" element={<Achievements />} />
                      <Route path="/create" element={<CreateMarket />} />
                      <Route path="/profile/:address?" element={<Profile />} />
                      <Route path="/daily-rewards" element={<DailyRewards />} />
                      <Route path="/admin" element={<Admin />} />
                    </Routes>
                  </AnimatePresence>
                </div>

                {/* Live Activity Feed - Floating sidebar */}
                <LiveActivityFeed />

                {/* Notification Center */}
                <NotificationCenter />

                {/* Toast notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    className: 'glass-strong',
                    style: {
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      borderRadius: '1rem',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#10B981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 4000,
                      iconTheme: {
                        primary: '#EF4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </NotificationProvider>
        </UserProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;
