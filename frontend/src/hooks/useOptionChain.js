import { useState, useEffect, useCallback, useRef } from 'react';
import { optionChainApi } from '../services/optionChainApi';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useOptionChain(symbol) {
  const [data, setData] = useState(null);
  const [expiries, setExpiries] = useState([]);
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const socketRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const activeRequestIdRef = useRef(0);

  const fetchChain = useCallback(async (expTarget = null) => {
    if (!symbol) return;
    const reqId = ++activeRequestIdRef.current;
    try {
      const res = await optionChainApi.getOptionChain(symbol, expTarget || selectedExpiry);
      // Stale response protection
      if (reqId !== activeRequestIdRef.current) return;

      if (res && res.success) {
        setData(res);
        setIsSupported(true);
        setError(null);
        if (Array.isArray(res.expiryDates)) {
          setExpiries(res.expiryDates);
        }
        if (res.selectedExpiry && !selectedExpiry) {
          setSelectedExpiry(res.selectedExpiry);
        }
        setLastUpdated(new Date());
      } else {
        if (res?.message?.includes('not available')) {
          setIsSupported(false);
        }
        setError(res?.message || `Unable to load option chain for ${symbol}`);
      }
    } catch (err) {
      if (reqId !== activeRequestIdRef.current) return;
      console.error(`[useOptionChain Error] ${symbol}:`, err);
      setError(err.message || 'Failed to fetch option chain data');
    } finally {
      if (reqId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [symbol, selectedExpiry]);

  // Initial Check & Load
  useEffect(() => {
    if (!symbol) return;

    let isMounted = true;
    const reqId = ++activeRequestIdRef.current;

    setLoading(true);
    setError(null);
    setData(null);

    const init = async () => {
      try {
        const supportRes = await optionChainApi.isSupported(symbol);
        if (!isMounted || reqId !== activeRequestIdRef.current) return;

        if (!supportRes.success || !supportRes.isSupported) {
          setIsSupported(false);
          setLoading(false);
          return;
        }

        const expRes = await optionChainApi.getExpiries(symbol);
        if (!isMounted || reqId !== activeRequestIdRef.current) return;

        if (expRes.success && Array.isArray(expRes.expiries) && expRes.expiries.length > 0) {
          setExpiries(expRes.expiries);
          const defaultExp = expRes.selectedExpiry || expRes.expiries[0];
          setSelectedExpiry(defaultExp);

          const chainRes = await optionChainApi.getOptionChain(symbol, defaultExp);
          if (isMounted && reqId === activeRequestIdRef.current) {
            if (chainRes && chainRes.success) {
              setData(chainRes);
              setLastUpdated(new Date());
            } else {
              setError(chainRes.message || 'Option chain data currently unavailable');
            }
          }
        } else if (isMounted) {
          setIsSupported(false);
        }
      } catch (err) {
        if (isMounted && reqId === activeRequestIdRef.current) {
          console.error('[useOptionChain Init Error]', err);
          setError('Failed to initialize option chain feed');
        }
      } finally {
        if (isMounted && reqId === activeRequestIdRef.current) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  // Handle Expiry Switch
  const handleExpiryChange = (newExpiry) => {
    if (newExpiry === selectedExpiry) return;
    setSelectedExpiry(newExpiry);
    setLoading(true);
    fetchChain(newExpiry);
  };

  // Socket.IO Real-time Subscription + Polling Fallback
  useEffect(() => {
    if (!symbol || !isSupported) return;

    const token = localStorage.getItem('token');
    const authOptions = (token && token !== 'null' && token !== 'undefined') ? { token } : {};

    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      auth: authOptions
    });
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('subscribeOptionChain', { symbol, expiry: selectedExpiry });
    });

    s.on('optionChain:update', (updatedChain) => {
      if (updatedChain && updatedChain.symbol === symbol) {
        setData(updatedChain);
        setLastUpdated(new Date());
      }
    });

    pollIntervalRef.current = setInterval(() => {
      fetchChain(selectedExpiry);
    }, 6000);

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unsubscribeOptionChain', { symbol, expiry: selectedExpiry });
        socketRef.current.disconnect();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [symbol, selectedExpiry, isSupported, fetchChain]);

  return {
    data,
    expiries,
    selectedExpiry,
    setSelectedExpiry: handleExpiryChange,
    loading,
    error,
    isSupported,
    lastUpdated,
    refresh: () => fetchChain(selectedExpiry)
  };
}
