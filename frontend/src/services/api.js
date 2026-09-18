const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchApi(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('token');

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // JWT token available ho to Authorization header bhejo
    if (token && token !== 'null' && token !== 'undefined') {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));

      // Token invalid or expired control
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }

      throw new Error(
        `API Error: ${errorData.message || res.statusText}`
      );
    }

    return await res.json();

  } catch (err) {
    console.error(`[API Call Failed] ${endpoint}`, err);
    throw err;
  }
}

export const authApi = {
  login: (credentials) =>
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  signup: (userData) =>
    fetchApi('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  getProfile: () =>
    fetchApi('/auth/profile')
};

export const marketApi = {
  getStatus: () => fetchApi('/market/status'),
  getRegime: () => fetchApi('/market/regime'),
  getIndices: () => fetchApi('/market/indices'),
  getBreadth: () => fetchApi('/market/breadth'),
  getSectors: () => fetchApi('/market/sectors'),
  getOverview: () => fetchApi('/market/overview')
};

export const stockApi = {
  getAll: (timeframe = '5m') =>
    fetchApi(`/stocks?timeframe=${timeframe}`),

  getOpenLow: (timeframe = '5m') =>
    fetchApi(`/stocks/open-low?timeframe=${timeframe}`),

  getGainers: () =>
    fetchApi('/stocks/gainers'),

  getLosers: () =>
    fetchApi('/stocks/losers'),

  getBullish: () =>
    fetchApi('/stocks/bullish'),

  getBearish: () =>
    fetchApi('/stocks/bearish'),

  getDetails: (symbol, timeframe = '5m', count = 150) =>
    fetchApi(`/stocks/${symbol}?timeframe=${timeframe}&count=${count}`),

  getCandles: (symbol, timeframe = '5m', count = 150) =>
    fetchApi(`/stocks/${symbol}/candles?timeframe=${timeframe}&count=${count}`)
};

export const watchlistApi = {
  get: () =>
    fetchApi('/watchlist'),

  add: (symbol) =>
    fetchApi('/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol })
    }),

  remove: (symbol) =>
    fetchApi(`/watchlist/${symbol}`, {
      method: 'DELETE'
    })
};

export const alertApi = {
  get: () =>
    fetchApi('/alerts'),

  create: (data) =>
    fetchApi('/alerts', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  delete: (id) =>
    fetchApi(`/alerts/${id}`, {
      method: 'DELETE'
    })
};

export const systemApi = {
  getHealth: () =>
    fetchApi('/system/health')
};