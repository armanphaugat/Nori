// core/hooks/useAuth.js
// Authentication state management hook

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../api/client';

/**
 * Manage authentication state and login/logout operations
 * @returns {{token, user, loading, error, login, logout, isAuthenticated}}
 */
export function useAuth() {
  const [token, setToken] = useState(() => apiClient.getStoredToken());
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('wb_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Login with Discord bot token
   * @param {string} botToken - The Discord bot token
   * @returns {Promise<{token, user}>}
   */
  const login = useCallback(async (botToken) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.auth.login(botToken);

      setToken(response.token);
      setUser(response.user);

      apiClient.setToken(response.token);
      localStorage.setItem('wb_user', JSON.stringify(response.user));

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout and clear all auth state
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setError(null);
    apiClient.clearToken();
    localStorage.removeItem('wb_user');
  }, []);

  return {
    token,
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!token,
  };
}