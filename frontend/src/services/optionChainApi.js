import { fetchApi } from './api';

export const optionChainApi = {
  isSupported: (symbol) =>
    fetchApi(`/options/${encodeURIComponent(symbol)}/supported`),

  getExpiries: (symbol) =>
    fetchApi(`/options/${encodeURIComponent(symbol)}/expiries`),

  getOptionChain: (symbol, expiry = '') => {
    const query = expiry ? `?expiry=${encodeURIComponent(expiry)}` : '';
    return fetchApi(`/options/${encodeURIComponent(symbol)}${query}`);
  }
};
