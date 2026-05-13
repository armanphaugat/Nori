// core/api/client.js
// Centralized API client for all backend communication

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class APIClient {
  constructor(baseURL = API_BASE) {
    this.baseURL = baseURL;
    this.token = this.getStoredToken();
  }

  getStoredToken() {
    try {
      return localStorage.getItem('wb_token') || null;
    } catch {
      return null;
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('wb_token', token);
    } else {
      localStorage.removeItem('wb_token');
    }
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('wb_token');
  }

  getHeaders(isFormData = false) {
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const { method = 'GET', body, isFormData = false } = options;

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: this.getHeaders(isFormData),
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      });

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch {
          error = { detail: `HTTP ${response.status}` };
        }
        throw new Error(error.detail || error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  // ─── HEALTH ───────────────────────────────────────────────────────────
  health = {
    check: () => this.request('/'),
  };

  // ─── AUTH ─────────────────────────────────────────────────────────────
  auth = {
    login: (token) =>
      this.request('/auth/login', {
        method: 'POST',
        body: { token },
      }),
    logout: () => {
      this.clearToken();
      return Promise.resolve({ status: 'success' });
    },
  };

  // ─── QUERY ────────────────────────────────────────────────────────────
  query = {
    ask: (question, server) =>
      this.request('/query', {
        method: 'POST',
        body: { question, server },
      }),
  };

  // ─── UPLOAD ───────────────────────────────────────────────────────────
  upload = {
    documents: async (files, urls, guildId) => {
      const formData = new FormData();
      formData.append('guild_id', guildId);

      files.forEach((file) => {
        formData.append('files', file);
      });

      if (urls.length > 0) {
        formData.append('urls', urls.join(' '));
      }

      return this.request('/upload', {
        method: 'PUT',
        body: formData,
        isFormData: true,
      });
    },
  };

  // ─── GUILDS ───────────────────────────────────────────────────────────
  guilds = {
    list: () => this.request('/guilds'),
    create: (guildData) =>
      this.request('/guilds/create', {
        method: 'POST',
        body: guildData,
      }),
    get: (guildId) => this.request(`/guilds/${guildId}`),
    delete: (guildId) =>
      this.request(`/guilds/${guildId}`, {
        method: 'DELETE',
      }),
  };

  // ─── ANALYTICS ─────────────────────────────────────────────────────────
  analytics = {
    get: (guildId) => this.request(`/analytics/${guildId}`),
    getAll: () => this.request('/analytics'),
  };

  // ─── CHANNELS ──────────────────────────────────────────────────────────
  channels = {
    list: (guildId) => this.request(`/channel/guild/${guildId}`),
  };

  // ─── SERVER ─────────────────────────────────────────────────────────────
  server = {
    info: () => this.request('/server'),
  };
}

export const apiClient = new APIClient();