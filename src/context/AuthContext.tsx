import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LearnerModel } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  learnerModel: LearnerModel | null;
  isLoading: boolean;
  login: (email: string, role: 'student' | 'teacher') => Promise<void>;
  register: (name: string, email: string, role: 'student' | 'teacher', grade?: string) => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  refreshLearnerModel: () => Promise<void>;
  logout: () => void;
  resetAllData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [learnerModel, setLearnerModel] = useState<LearnerModel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUserId = localStorage.getItem('learniq_user_id');
    if (savedUserId) {
      loadUser(savedUserId);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const { user: fetchedUser } = await api.getMe(userId);
      if (fetchedUser) {
        setUser(fetchedUser);
        localStorage.setItem('learniq_user_id', fetchedUser.id);

        if (fetchedUser.role === 'student') {
          const { model } = await api.getLearnerMastery(fetchedUser.id);
          setLearnerModel(model);
        } else {
          setLearnerModel(null);
        }
      } else {
        setUser(null);
        setLearnerModel(null);
        localStorage.removeItem('learniq_user_id');
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      setUser(null);
      setLearnerModel(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, role: 'student' | 'teacher') => {
    setIsLoading(true);
    try {
      const res = await api.login(email, role);
      setUser(res.user);
      localStorage.setItem('learniq_user_id', res.user.id);
      if (res.user.role === 'student') {
        const { model } = await api.getLearnerMastery(res.user.id);
        setLearnerModel(model);
      } else {
        setLearnerModel(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, role: 'student' | 'teacher', grade?: string) => {
    setIsLoading(true);
    try {
      const res = await api.register({ name, email, role, grade });
      setUser(res.user);
      localStorage.setItem('learniq_user_id', res.user.id);
      if (res.user.role === 'student') {
        const { model } = await api.getLearnerMastery(res.user.id);
        setLearnerModel(model);
      } else {
        setLearnerModel(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchUser = async (userId: string) => {
    await loadUser(userId);
  };

  const refreshLearnerModel = async () => {
    if (user && user.role === 'student') {
      try {
        const { model } = await api.getLearnerMastery(user.id);
        setLearnerModel(model);
      } catch (e) {
        console.error('Error refreshing learner model:', e);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('learniq_user_id');
    setUser(null);
    setLearnerModel(null);
  };

  const resetAllData = async () => {
    try {
      await fetch('/api/admin/reset', { method: 'POST' });
      logout();
    } catch (e) {
      console.error('Error resetting data:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        learnerModel,
        isLoading,
        login,
        register,
        switchUser,
        refreshLearnerModel,
        logout,
        resetAllData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
