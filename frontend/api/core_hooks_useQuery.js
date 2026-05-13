// core/hooks/useQuery.js
// Query/Q&A state management hook

import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';

/**
 * Handle querying the knowledge base with conversation history
 * @returns {{messages, loading, error, ask, clearMessages, addMessage}}
 */
export function useQuery() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Ask a question to the knowledge base
   * @param {string} question - The question to ask
   * @param {string} guildId - The guild/server ID
   * @returns {Promise}
   */
  const ask = useCallback(async (question, guildId) => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    // Add user message immediately for better UX
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await apiClient.query.ask(question, guildId);

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: response.answer || response.message || '',
        sources: response.sources || [],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      return response;
    } catch (err) {
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'error',
        content: err.message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear all messages from the conversation
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Manually add a message (for testing or special cases)
   * @param {Object} message - Message object
   */
  const addMessage = useCallback((message) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...message,
      },
    ]);
  }, []);

  return {
    messages,
    loading,
    error,
    ask,
    clearMessages,
    addMessage,
  };
}