// core/api/endpoints.js
// Centralized API endpoint constants

export const ENDPOINTS = {
  // Health
  HEALTH: '/',

  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',

  // Query
  QUERY: '/query',

  // Upload
  UPLOAD: '/upload',

  // Guilds
  GUILDS: '/guilds',
  GUILDS_CREATE: '/guilds/create',
  GUILDS_BY_ID: (id) => `/guilds/${id}`,
  GUILDS_DELETE: (id) => `/guilds/${id}`,

  // Channels
  CHANNELS_BY_GUILD: (guildId) => `/channel/guild/${guildId}`,

  // Analytics
  ANALYTICS: '/analytics',
  ANALYTICS_BY_GUILD: (guildId) => `/analytics/${guildId}`,

  // Server
  SERVER_INFO: '/server',
};

/**
 * Helper to construct API URLs
 * @param {string} endpoint - The endpoint path
 * @returns {string} Full API URL
 */
export function getApiUrl(endpoint) {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  return `${baseUrl}${endpoint}`;
}