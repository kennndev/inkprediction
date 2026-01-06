import { createContext, useContext, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const { address, isConnected } = useAccount();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserData();
    } else {
      setUserData(null);
      setLoading(false);
    }
  }, [address, isConnected]);

  const fetchUserData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const [statsRes, achievementsRes] = await Promise.all([
        axios.get(`${API_URL}/api/user/${address}/stats`),
        axios.get(`${API_URL}/api/user/${address}/achievements`),
      ]);

      setUserData({
        address,
        stats: statsRes.data,
        achievements: achievementsRes.data.achievements || [],
        level: calculateLevel(statsRes.data.xp || 0),
        xp: statsRes.data.xp || 0,
        streak: statsRes.data.streak || 0,
        winRate: statsRes.data.winRate || 0,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Set default data
      setUserData({
        address,
        stats: {},
        achievements: [],
        level: 1,
        xp: 0,
        streak: 0,
        winRate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const addXP = (amount) => {
    setUserData(prev => {
      if (!prev) return prev;
      const newXP = (prev.xp || 0) + amount;
      return {
        ...prev,
        xp: newXP,
        level: calculateLevel(newXP),
      };
    });
  };

  const refreshUserData = () => {
    if (isConnected && address) {
      fetchUserData();
    }
  };

  return (
    <UserContext.Provider value={{
      userData,
      loading,
      addXP,
      refreshUserData,
      isLoggedIn: isConnected && !!userData,
    }}>
      {children}
    </UserContext.Provider>
  );
};

// XP to Level calculation
const calculateLevel = (xp) => {
  // Level formula: level = floor(sqrt(xp / 100))
  // Level 1: 0-99 XP
  // Level 2: 100-399 XP
  // Level 3: 400-899 XP
  // etc.
  return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
};

export const getXPForNextLevel = (level) => {
  return level * level * 100;
};

export const getXPProgress = (xp, level) => {
  const currentLevelXP = (level - 1) * (level - 1) * 100;
  const nextLevelXP = level * level * 100;
  return ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
};
