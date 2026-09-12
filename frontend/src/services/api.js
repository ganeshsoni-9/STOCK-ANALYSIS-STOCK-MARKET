const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`[API Call Failed] ${endpoint}`, err);
    throw err;
  }
}

export const marketApi = {
  getStatus: () => fetchApi('/market/status'),
  getRegime: () => fetchApi('/market/regime'),
  getIndices: () => fetchApi('/market/indices'),
  getBreadth: () => fetchApi('/market/breadth'),
  getSectors: () => fetchApi('/market/sectors'),
  getOverview: () => fetchApi('/market/overview')
};

export const stockApi = {
  getAll: (timeframe = '5m') => fetchApi(`/stocks?timeframe=${timeframe}`),
  getGainers: () => fetchApi('/stocks/gainers'),
  getLosers: () => fetchApi('/stocks/losers'),
  getBullish: () => fetchApi('/stocks/bullish'),
  getBearish: () => fetchApi('/stocks/bearish'),
  getDetails: (symbol, timeframe = '5m') => fetchApi(`/stocks/${symbol}?timeframe=${timeframe}`),
  getCandles: (symbol, timeframe = '5m') => fetchApi(`/stocks/${symbol}/candles?timeframe=${timeframe}`)
};

export const watchlistApi = {
  get: () => fetchApi('/watchlist'),
  add: (symbol) => fetchApi('/watchlist', { method: 'POST', body: JSON.stringify({ symbol }) }),
  remove: (symbol) => fetchApi(`/watchlist/${symbol}`, { method: 'DELETE' })
};

export const alertApi = {
  get: () => fetchApi('/alerts'),
  create: (data) => fetchApi('/alerts', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => fetchApi(`/alerts/${id}`, { method: 'DELETE' })
};

export const systemApi = {
  getHealth: () => fetchApi('/system/health')
};
