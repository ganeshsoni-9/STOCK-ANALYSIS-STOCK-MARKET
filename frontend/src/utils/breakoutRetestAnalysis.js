/**
 * 5-Minute High/Low Breakout + Retest Analysis Engine
 * Evaluates Indian Equity Intraday Candles strictly according to rule-based confirmation.
 */

export function isIndianMarketOpen() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value;
  const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);

  const timeInMinutes = hour * 60 + minute;
  const marketOpen = 9 * 60 + 15;   // 09:15 AM IST
  const marketClose = 15 * 60 + 30; // 03:30 PM IST
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  return !isWeekend && timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}

export function formatIstTime(timestamp) {
  if (!timestamp) return '—';
  try {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (e) {
    return '—';
  }
}

/**
 * Calculates 5-Minute High/Low Breakout + Retest Analysis
 * @param {Array} candles - Array of 5m OHLC candle objects
 * @param {number} currentPrice - Current LTP
 * @param {object} options - Optional configuration { source, symbol, lastUpdated }
 * @returns {object} Full breakout & retest metrics
 */
export function calculate5MinBreakoutAnalysis(candles, currentPrice, options = {}) {
  const isMarketOpen = typeof options.isMarketOpen === 'boolean' ? options.isMarketOpen : isIndianMarketOpen();
  const source = options.source || 'NSE Real-Time / Yahoo Free Live';
  const dataTimestamp = options.lastUpdated || (candles && candles.length > 0 ? candles[candles.length - 1].timestamp : Date.now());

  // 1. Data Availability Verification (Never fabricate candles)
  if (!Array.isArray(candles) || candles.length === 0) {
    return {
      isAvailable: false,
      status: 'DATA UNAVAILABLE',
      reason: 'Genuine 5-minute candle data is currently unavailable for this instrument.',
      isMarketOpen,
      source,
      dataTimestamp
    };
  }

  // Filter valid completed OHLC data points
  const validCandles = candles.filter(
    (c) => c && typeof c.high === 'number' && typeof c.low === 'number' && typeof c.close === 'number' && !isNaN(c.close)
  );

  if (validCandles.length === 0) {
    return {
      isAvailable: false,
      status: 'DATA UNAVAILABLE',
      reason: 'Missing or corrupt 5-minute candle data.',
      isMarketOpen,
      source,
      dataTimestamp
    };
  }

  // 2. Isolate Current Trading Session's Candles
  const lastCandle = validCandles[validCandles.length - 1];
  const lastDateStr = new Date(lastCandle.timestamp).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

  let sessionCandles = validCandles.filter(
    (c) => new Date(c.timestamp).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) === lastDateStr
  );

  // Fallback: If timestamps don't span multi-days or timezone difference, use up to last 75 bars (one 5m session)
  if (sessionCandles.length === 0) {
    sessionCandles = validCandles.slice(-75);
  }

  // 3. Establish 5-Minute Reference High & Low
  const firstCandle = sessionCandles[0];
  const refHigh = Number(firstCandle.high.toFixed(2));
  const refLow = Number(firstCandle.low.toFixed(2));
  const refOpen = Number(firstCandle.open.toFixed(2));
  const refClose = Number(firstCandle.close.toFixed(2));
  const refTime = formatIstTime(firstCandle.timestamp);
  const refRange = Number((refHigh - refLow).toFixed(2));
  const refRangePct = refLow > 0 ? Number(((refRange / refLow) * 100).toFixed(2)) : 0;

  const price = typeof currentPrice === 'number' && !isNaN(currentPrice) && currentPrice > 0 ? currentPrice : refClose;

  // 4. Iterate Subsequent Completed Candles for Breakout & Retest
  const subsequentCandles = sessionCandles.slice(1);

  let breakoutType = null; // 'BULLISH' | 'BEARISH' | null
  let breakoutCandle = null;
  let breakoutIndex = -1;
  let retestStatus = 'NOT_TESTED'; // 'NOT_TESTED' | 'WAITING' | 'IN_PROGRESS' | 'CONFIRMED' | 'FAILED'
  let retestCandle = null;
  let confirmationCandle = null;

  for (let i = 0; i < subsequentCandles.length; i++) {
    const c = subsequentCandles[i];

    if (!breakoutType) {
      if (c.close > refHigh) {
        breakoutType = 'BULLISH';
        breakoutCandle = c;
        breakoutIndex = i;
        retestStatus = 'WAITING';
      } else if (c.close < refLow) {
        breakoutType = 'BEARISH';
        breakoutCandle = c;
        breakoutIndex = i;
        retestStatus = 'WAITING';
      }
    } else if (breakoutType === 'BULLISH' && i > breakoutIndex) {
      // Check if price pulled back into retest zone around refHigh (within 0.3%)
      const touchedRetestZone = c.low <= refHigh * 1.003;
      const heldSupport = c.close >= refHigh * 0.995;

      if (c.close < refLow) {
        // Deep breakdown back inside range -> Failed Breakout
        retestStatus = 'FAILED';
      } else if (touchedRetestZone && heldSupport) {
        retestCandle = c;
        // Confirmation: Candle closes bullish (close > open) and closes strictly >= refHigh
        if (c.close >= c.open && c.close >= refHigh) {
          retestStatus = 'CONFIRMED';
          confirmationCandle = c;
        } else {
          retestStatus = 'IN_PROGRESS';
        }
      } else if (retestStatus === 'IN_PROGRESS' && c.close >= c.open && c.close >= refHigh) {
        retestStatus = 'CONFIRMED';
        confirmationCandle = c;
      }
    } else if (breakoutType === 'BEARISH' && i > breakoutIndex) {
      // Check if price bounced up into retest zone around refLow (within 0.3%)
      const touchedRetestZone = c.high >= refLow * 0.997;
      const heldResistance = c.close <= refLow * 1.005;

      if (c.close > refHigh) {
        // Strong rally back inside range -> Failed Breakdown
        retestStatus = 'FAILED';
      } else if (touchedRetestZone && heldResistance) {
        retestCandle = c;
        // Confirmation: Candle closes bearish (close < open) and closes strictly <= refLow
        if (c.close <= c.open && c.close <= refLow) {
          retestStatus = 'CONFIRMED';
          confirmationCandle = c;
        } else {
          retestStatus = 'IN_PROGRESS';
        }
      } else if (retestStatus === 'IN_PROGRESS' && c.close <= c.open && c.close <= refLow) {
        retestStatus = 'CONFIRMED';
        confirmationCandle = c;
      }
    }
  }

  // 5. Structure Trade Setup & Enforce Rule 7 (Never show entry before retest confirmation)
  let setupSignal = 'NO TRADE';
  let setupType = 'NO_TRADE';
  let entryPrice = null;
  let stopLoss = null;
  let target1 = null;
  let target2 = null;
  let riskReward = 'N/A';
  let statusReason = '';

  const isConfirmed = retestStatus === 'CONFIRMED';

  if (!isConfirmed) {
    setupSignal = 'NO TRADE';
    setupType = 'NO_TRADE';

    if (!breakoutType) {
      statusReason = `Price (₹${price}) is consolidating inside the reference 5M range (₹${refLow} – ₹${refHigh}).`;
    } else if (breakoutType === 'BULLISH') {
      if (retestStatus === 'WAITING') {
        statusReason = `Bullish breakout above ₹${refHigh} detected at ${formatIstTime(breakoutCandle?.timestamp)}. Waiting for completed candle pullback & retest.`;
      } else if (retestStatus === 'IN_PROGRESS') {
        statusReason = `Pullback to ₹${refHigh} is testing support. Awaiting completed bullish confirmation candle before entry.`;
      } else if (retestStatus === 'FAILED') {
        statusReason = `Bullish breakout failed. Price violated support and fell back into the range.`;
      }
    } else if (breakoutType === 'BEARISH') {
      if (retestStatus === 'WAITING') {
        statusReason = `Bearish breakdown below ₹${refLow} detected at ${formatIstTime(breakoutCandle?.timestamp)}. Waiting for completed candle bounce & retest.`;
      } else if (retestStatus === 'IN_PROGRESS') {
        statusReason = `Pullback to ₹${refLow} is testing resistance. Awaiting completed bearish confirmation candle before entry.`;
      } else if (retestStatus === 'FAILED') {
        statusReason = `Bearish breakdown failed. Price recovered back into the range.`;
      }
    }
  } else {
    // Retest is strictly CONFIRMED
    if (breakoutType === 'BULLISH') {
      setupType = 'BULLISH_BUY';
      entryPrice = Number(confirmationCandle.close.toFixed(2));
      const lowestRetestLow = Math.min(retestCandle?.low || entryPrice, confirmationCandle.low);
      const riskDistance = Math.max(entryPrice * 0.003, Number((entryPrice - lowestRetestLow + refRange * 0.05).toFixed(2)));
      stopLoss = Number((entryPrice - riskDistance).toFixed(2));
      target1 = Number((entryPrice + 1.5 * riskDistance).toFixed(2));
      target2 = Number((entryPrice + 2.5 * riskDistance).toFixed(2));
      riskReward = '1 : 2.0';

      if (!isMarketOpen) {
        setupSignal = 'NO TRADE (Market Closed)';
        statusReason = `Bullish Breakout + Retest confirmed at ${formatIstTime(confirmationCandle.timestamp)}. Fresh live entries paused while Indian market is closed.`;
      } else {
        setupSignal = '🟢 BULLISH BUY (Breakout + Retest Confirmed)';
        statusReason = `Bullish Breakout & Retest confirmed! Price tested ₹${refHigh} and bounced with confirmed green candle closing at ₹${entryPrice}.`;
      }
    } else if (breakoutType === 'BEARISH') {
      setupType = 'BEARISH_SHORT';
      entryPrice = Number(confirmationCandle.close.toFixed(2));
      const highestRetestHigh = Math.max(retestCandle?.high || entryPrice, confirmationCandle.high);
      const riskDistance = Math.max(entryPrice * 0.003, Number((highestRetestHigh - entryPrice + refRange * 0.05).toFixed(2)));
      stopLoss = Number((entryPrice + riskDistance).toFixed(2));
      target1 = Number((entryPrice - 1.5 * riskDistance).toFixed(2));
      target2 = Number((entryPrice - 2.5 * riskDistance).toFixed(2));
      riskReward = '1 : 2.0';

      if (!isMarketOpen) {
        setupSignal = 'NO TRADE (Market Closed)';
        statusReason = `Bearish Breakdown + Retest confirmed at ${formatIstTime(confirmationCandle.timestamp)}. Fresh live entries paused while Indian market is closed.`;
      } else {
        setupSignal = '🔴 BEARISH SHORT-SELL (Breakdown + Retest Confirmed)';
        statusReason = `Bearish Breakdown & Retest confirmed! Price tested ₹${refLow} and rejected with confirmed red candle closing at ₹${entryPrice}.`;
      }
    }
  }

  // Breakout Status string
  let breakoutStatus = 'INSIDE RANGE';
  if (breakoutType === 'BULLISH') breakoutStatus = 'BULLISH BREAKOUT';
  if (breakoutType === 'BEARISH') breakoutStatus = 'BEARISH BREAKDOWN';

  // Retest Status string
  let retestStatusLabel = 'N/A (Inside Range)';
  if (retestStatus === 'WAITING') retestStatusLabel = 'WAITING FOR RETEST';
  if (retestStatus === 'IN_PROGRESS') retestStatusLabel = 'RETESTING LEVEL';
  if (retestStatus === 'CONFIRMED') retestStatusLabel = 'RETEST CONFIRMED';
  if (retestStatus === 'FAILED') retestStatusLabel = 'RETEST FAILED (FAKE BREAKOUT)';

  return {
    isAvailable: true,
    status: 'AVAILABLE',
    isMarketOpen,
    refHigh,
    refLow,
    refOpen,
    refClose,
    refTime,
    refRange,
    refRangePct,
    currentPrice: price,
    breakoutType,
    breakoutStatus,
    breakoutTime: breakoutCandle ? formatIstTime(breakoutCandle.timestamp) : null,
    breakoutPrice: breakoutCandle ? Number(breakoutCandle.close.toFixed(2)) : null,
    retestStatus: retestStatusLabel,
    retestTime: retestCandle ? formatIstTime(retestCandle.timestamp) : null,
    confirmationTime: confirmationCandle ? formatIstTime(confirmationCandle.timestamp) : null,
    setupType,
    setupSignal,
    statusReason,
    entryPrice: isConfirmed ? entryPrice : null,
    stopLoss: isConfirmed ? stopLoss : null,
    target1: isConfirmed ? target1 : null,
    target2: isConfirmed ? target2 : null,
    riskReward: isConfirmed ? riskReward : 'N/A',
    source,
    dataTimestamp: formatIstTime(dataTimestamp),
    completedCandlesCount: sessionCandles.length,
    checklist: [
      {
        title: '5M Reference High/Low Established',
        met: true,
        detail: `09:15 5M Candle High: ₹${refHigh} | Low: ₹${refLow}`
      },
      {
        title: 'Breakout Beyond 5M Boundary',
        met: breakoutType !== null,
        detail: breakoutType
          ? `${breakoutType} breakout closed outside 5M range at ${formatIstTime(breakoutCandle?.timestamp)}`
          : 'Pending: Price currently inside 5M boundary'
      },
      {
        title: 'Completed Retest Confirmation',
        met: isConfirmed,
        detail: isConfirmed
          ? `Retest verified & supported at ₹${breakoutType === 'BULLISH' ? refHigh : refLow}`
          : retestStatusLabel
      },
      {
        title: 'Active Live Market Session',
        met: isMarketOpen,
        detail: isMarketOpen ? '09:15 – 15:30 IST Regular Market Session' : 'Market Closed (Signals Paused)'
      }
    ]
  };
}
