import { useState, useEffect, useCallback } from 'react';
import { api, type User } from '@/services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('spaceman_user');
    if (savedUser) {
      try {
        setState(prev => ({ ...prev, user: JSON.parse(savedUser) }));
      } catch (error) {
        localStorage.removeItem('spaceman_user');
      }
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const users = await api.getUsers();
      const user = users.find(u => u.username === username && u.password === password);
      
      if (!user) {
        throw new Error('Username atau password salah');
      }

      setState(prev => ({ ...prev, user, isLoading: false }));
      localStorage.setItem('spaceman_user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Login gagal',
        isLoading: false 
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const users = await api.getUsers();
      if (users.find(u => u.username === username)) {
        throw new Error('Username sudah digunakan');
      }

      const newUser = await api.createUser({
        username,
        password,
        balance: 100000, // Starting balance: Rp100K
      });

      setState(prev => ({ ...prev, user: newUser, isLoading: false }));
      localStorage.setItem('spaceman_user', JSON.stringify(newUser));
      
      return newUser;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Registrasi gagal',
        isLoading: false 
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setState(prev => ({ ...prev, user: null }));
    localStorage.removeItem('spaceman_user');
  }, []);

  const updateBalance = useCallback(async (newBalance: number) => {
    if (!state.user) return;
    
    try {
      await api.updateUserBalance(state.user.id, newBalance);
      const updatedUser = { ...state.user, balance: newBalance };
      setState(prev => ({ ...prev, user: updatedUser }));
      localStorage.setItem('spaceman_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  }, [state.user]);

  return {
    ...state,
    login,
    register,
    logout,
    updateBalance,
  };
}