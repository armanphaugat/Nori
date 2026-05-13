// core/hooks/useGuild.js
// Guild/server selection and management hook

import { useState, useCallback } from 'react';

const DEFAULT_GUILDS = [
  {
    id: '1476466974098985067',
    name: 'Main Server',
    createdAt: Date.now(),
    color: '#6366f1',
  },
];

/**
 * Manage active guild/server selection and guild list
 * @returns {{activeGuildId, guilds, setActiveGuild, setGuilds, getActiveGuild}}
 */
export function useGuild() {
  const [activeGuildId, setActiveGuildIdState] = useState(() =>
    localStorage.getItem('wb_active_guild') || DEFAULT_GUILDS[0].id
  );

  const [guilds, setGuildsState] = useState(() => {
    try {
      const stored = localStorage.getItem('wb_guilds');
      return stored ? JSON.parse(stored) : DEFAULT_GUILDS;
    } catch {
      return DEFAULT_GUILDS;
    }
  });

  /**
   * Set the active guild
   * @param {string} id - Guild ID
   */
  const setActiveGuild = useCallback((id) => {
    setActiveGuildIdState(id);
    localStorage.setItem('wb_active_guild', id);
  }, []);

  /**
   * Update the guilds list
   * @param {Array} newGuilds - New guilds array
   */
  const setGuilds = useCallback((newGuilds) => {
    setGuildsState(newGuilds);
    localStorage.setItem('wb_guilds', JSON.stringify(newGuilds));

    // If active guild was deleted, switch to first guild
    if (!newGuilds.find((g) => g.id === activeGuildId) && newGuilds.length > 0) {
      setActiveGuild(newGuilds[0].id);
    }
  }, [activeGuildId, setActiveGuild]);

  /**
   * Get the currently active guild object
   * @returns {Object|null}
   */
  const getActiveGuild = useCallback(() => {
    return guilds.find((g) => g.id === activeGuildId) || null;
  }, [guilds, activeGuildId]);

  /**
   * Add a new guild
   * @param {Object} guild - Guild data
   */
  const addGuild = useCallback(
    (guild) => {
      setGuilds([...guilds, guild]);
    },
    [guilds, setGuilds]
  );

  /**
   * Remove a guild
   * @param {string} id - Guild ID
   */
  const removeGuild = useCallback(
    (id) => {
      setGuilds(guilds.filter((g) => g.id !== id));
    },
    [guilds, setGuilds]
  );

  /**
   * Update a guild
   * @param {string} id - Guild ID
   * @param {Object} updates - Updates to apply
   */
  const updateGuild = useCallback(
    (id, updates) => {
      setGuilds(
        guilds.map((g) => (g.id === id ? { ...g, ...updates } : g))
      );
    },
    [guilds, setGuilds]
  );

  return {
    activeGuildId,
    guilds,
    setActiveGuild,
    setGuilds,
    getActiveGuild,
    addGuild,
    removeGuild,
    updateGuild,
  };
}