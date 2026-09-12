/**
 * Handles Indian Equity Market Hours (IST - Asia/Kolkata)
 */
function getMarketStatus() {
  // Use Asia/Kolkata timezone
  const now = new Date();
  const options = { timeZone: 'Asia/Kolkata', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const istString = new Intl.DateTimeFormat('en-US', options).format(now);
  
  // Format: MM/DD/YYYY, HH:mm:ss
  const parts = istString.match(/(\d+)\/(\d+)\/(\d+),\s+(\d+):(\d+):(\d+)/);
  let isWeekend = false;
  let hour = 10;
  let minute = 0;

  if (parts) {
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const year = parseInt(parts[3], 10);
    hour = parseInt(parts[4], 10);
    minute = parseInt(parts[5], 10);

    const istDate = new Date(Date.UTC(year, month, day, hour, minute));
    const dayOfWeek = istDate.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      isWeekend = true;
    }
  }

  const timeInMinutes = hour * 60 + minute;
  const preMarketOpen = 9 * 60;        // 09:00 AM (540 mins)
  const marketOpen = 9 * 60 + 15;      // 09:15 AM (555 mins)
  const openingRangeEnd = 9 * 60 + 30; // 09:30 AM (570 mins)
  const marketClose = 15 * 60 + 30;    // 03:30 PM (930 mins)

  let status = 'LIVE MARKET';
  let isMarketOpen = true;

  if (isWeekend) {
    status = 'MARKET CLOSED (WEEKEND)';
    isMarketOpen = false;
  } else if (timeInMinutes >= preMarketOpen && timeInMinutes < marketOpen) {
    status = 'PRE-MARKET';
    isMarketOpen = false;
  } else if (timeInMinutes >= marketOpen && timeInMinutes <= marketClose) {
    status = 'LIVE MARKET';
    isMarketOpen = true;
  } else {
    status = 'MARKET CLOSED';
    isMarketOpen = false;
  }

  const timeSinceOpenMinutes = Math.max(0, timeInMinutes - marketOpen);
  const timeUntilCloseMinutes = Math.max(0, marketClose - timeInMinutes);

  return {
    status,
    isMarketOpen,
    istTimeString: istString,
    marketOpenTime: '09:15 AM IST',
    marketCloseTime: '03:30 PM IST',
    timeSinceOpenMinutes,
    timeUntilCloseMinutes,
    isOpeningRangeWindow: timeInMinutes >= marketOpen && timeInMinutes <= openingRangeEnd
  };
}

/**
 * Calculates Opening Range Breakout / Breakdown Status
 * @param {number} ltp
 * @param {number} orh - Opening Range High (09:15 - 09:30)
 * @param {number} orl - Opening Range Low (09:15 - 09:30)
 */
function analyzeOpeningRange(ltp, orh, orl) {
  if (!orh || !orl) {
    return { status: 'INSIDE RANGE', diffPercent: 0 };
  }

  if (ltp > orh) {
    const diffPct = Number((((ltp - orh) / orh) * 100).toFixed(2));
    return { status: 'BULLISH BREAKOUT', diffPercent: diffPct, high: orh, low: orl };
  } else if (ltp < orl) {
    const diffPct = Number((((orl - ltp) / orl) * 100).toFixed(2));
    return { status: 'BEARISH BREAKDOWN', diffPercent: diffPct, high: orh, low: orl };
  } else {
    return { status: 'INSIDE RANGE', diffPercent: 0, high: orh, low: orl };
  }
}

module.exports = { getMarketStatus, analyzeOpeningRange };
