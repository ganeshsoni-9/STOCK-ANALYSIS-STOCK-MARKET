const RAW_API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_PROD_API = 'https://stock-analysis-stock-market-k51i.onrender.com/api';

function getBaseUrl() {
  let base = RAW_API_URL;
  if (!base || base === 'undefined' || base === 'null' || base.trim() === '') {
    base = DEFAULT_PROD_API;
  }
  return base.replace(/\/+$/, '');
}

function getFullUrl(endpoint) {
  const baseUrl = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

export async function fetchApi(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('token');

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token && token !== 'null' && token !== 'undefined') {
      headers.Authorization = `Bearer ${token}`;
    }

    const fullUrl = getFullUrl(endpoint);

    const res = await fetch(fullUrl, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errorMessage = res.statusText;
      try {
        const errorData = await res.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Non-JSON error body
      }

      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }

      throw new Error(`API Error [${res.status}]: ${errorMessage}`);
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }

    const textData = await res.text();
    if (textData.trim().startsWith('<')) {
      throw new SyntaxError(`Server returned HTML instead of JSON. Expected API JSON response from ${fullUrl} but received HTML page.`);
    }

    try {
      return JSON.parse(textData);
    } catch (e) {
      throw new Error(`Invalid JSON response from ${fullUrl}`);
    }

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
  getOverview: () => fetchApi('/market/overview'),
  getTradePlan: (symbol = 'NIFTY 50') => fetchApi(`/market/trade-plan/${encodeURIComponent(symbol)}`)
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