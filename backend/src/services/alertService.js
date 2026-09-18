const Alert = require('../models/Alert');
const stockScannerService = require('./stockScannerService');

async function checkAndTriggerAlerts() {
  const triggeredAlerts = [];
  try {
    const activeAlerts = await Alert.find({ active: true });
    if (!activeAlerts || activeAlerts.length === 0) {
      return triggeredAlerts;
    }

    let stockMap = new Map();
    try {
      const scannedData = await stockScannerService.scanAllStocks('5m');
      if (scannedData && Array.isArray(scannedData.stocks)) {
        scannedData.stocks.forEach((s) => {
          if (s && s.symbol) {
            stockMap.set(s.symbol.toUpperCase(), s);
          }
        });
      }
    } catch (err) {
      console.warn('[AlertService Warning] Error scanning stocks for alerts:', err.message);
    }

    const fiveMinutesMs = 5 * 60 * 1000;
    const now = Date.now();

    for (const alert of activeAlerts) {
      try {
        const symbol = alert.symbol ? alert.symbol.toUpperCase() : null;
        if (!symbol) continue;

        let stockData = stockMap.get(symbol);
        if (!stockData) {
          try {
            const details = await stockScannerService.getStockDetails(symbol, '5m');
            if (details && details.stock) {
              stockData = {
                symbol: details.stock.symbol,
                ltp: details.stock.ltp,
                vwap: details.stock.vwap,
                bullishScore: details.signalData?.bullishScore || 0,
                bearishScore: details.signalData?.bearishScore || 0,
                openingRange: details.openingRange
              };
            }
          } catch (e) {
            console.warn(`[AlertService Warning] Could not fetch details for symbol ${symbol}:`, e.message);
            continue;
          }
        }

        if (!stockData) continue;

        // 5 minute cooldown check
        if (alert.lastTriggeredAt) {
          const lastTime = new Date(alert.lastTriggeredAt).getTime();
          if (now - lastTime < fiveMinutesMs) {
            continue;
          }
        }

        const ltp = stockData.ltp;
        const vwap = stockData.vwap;
        const bullishScore = stockData.bullishScore ?? 0;
        const bearishScore = stockData.bearishScore ?? 0;
        const orh = stockData.openingRange?.orh;
        const orl = stockData.openingRange?.orl;

        let triggered = false;
        let currentValue = null;

        switch (alert.conditionType) {
          case 'BULLISH_SCORE_GREATER':
            currentValue = bullishScore;
            if (bullishScore >= alert.targetValue) triggered = true;
            break;
          case 'BEARISH_SCORE_GREATER':
            currentValue = bearishScore;
            if (bearishScore >= alert.targetValue) triggered = true;
            break;
          case 'PRICE_ABOVE_VWAP':
            currentValue = ltp;
            if (vwap !== undefined && vwap !== null && ltp > vwap) triggered = true;
            break;
          case 'ORH_BREAKOUT':
            currentValue = ltp;
            if (orh !== undefined && orh !== null && ltp > orh) triggered = true;
            break;
          case 'ORL_BREAKDOWN':
            currentValue = ltp;
            if (orl !== undefined && orl !== null && ltp < orl) triggered = true;
            break;
          default:
            break;
        }

        if (triggered) {
          const triggeredDate = new Date();
          alert.lastTriggeredAt = triggeredDate;
          await alert.save();

          triggeredAlerts.push({
            alertId: alert._id.toString(),
            userId: alert.userId,
            symbol: alert.symbol,
            conditionType: alert.conditionType,
            targetValue: alert.targetValue,
            triggeredAt: triggeredDate.toISOString(),
            currentValue
          });
        }
      } catch (alertErr) {
        console.warn(`[AlertService Warning] Error checking alert ${alert._id}:`, alertErr.message);
      }
    }
  } catch (error) {
    console.error('[AlertService Error] Critical error in checkAndTriggerAlerts:', error.message);
  }

  return triggeredAlerts;
}

module.exports = { checkAndTriggerAlerts };
