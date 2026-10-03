/**
 * Master Intraday Trade Plan Engine
 * Assembles rule-based intraday decision support analysis for NIFTY 50 and BANK NIFTY.
 * Incorporates:
 * - Market Hours & Data Freshness verification
 * - Multi-Timeframe Structure (15M context, 5M setup)
 * - Dynamic Supply & Demand Zones
 * - Dynamic Support, Resistance, PDH, PDL, VWAP
 * - Transparent Entry Checklist (☑ / ☐) & explicit waiting reasons
 * - Structural Stop-Loss, Dynamic Targets (T1, T2, T3)
 * - Risk/Reward ratios & min threshold check (MIN_RISK_REWARD = 1.5)
 * - Technical Setup Quality Score (0-100 score representing technical quality, NOT profit probability)
 * - Trade State Management & 6 explicit Exit Conditions
 * - Honest explanations (NO GUARANTEED TRADES, DATA UNAVAILABLE if missing)
 */

const { getMarketStatus } = require('../../utils/marketHours');
const { analyzeMarketStructure } = require('./structureEngine');
const { detectSupplyAndDemandZones } = require('./zoneEngine');
const { calculateKeyLevels } = require('./levelEngine');
const { evaluateSetup } = require('./setupEngine');
const { evaluateTradeManagement } = require('./managementEngine');

function generateIntradayTradePlan(symbolInput, quote, candles15m = [], candles5m = [], candles1m = [], dataStatus = 'LIVE', dataSource = 'free_live') {
  const symbol = (symbolInput || 'NIFTY 50').toUpperCase();
  const marketHours = getMarketStatus();
  const timestamp = Date.now();
  const dataAge = quote?.timestamp ? Math.max(0, Math.floor((timestamp - quote.timestamp) / 1000)) : 0;

  // Stale data check (threshold 60s)
  let effectiveDataStatus = dataStatus;
  if (dataAge > 60 && dataStatus === 'LIVE') {
    effectiveDataStatus = 'STALE';
  }

  // Handle Missing / Invalid Data
  if (!quote || !quote.ltp || (candles5m.length === 0 && candles15m.length === 0)) {
    return {
      symbol,
      marketStatus: marketHours.status,
      dataStatus: 'UNAVAILABLE',
      dataSource,
      timestamp,
      dataAge,
      currentPrice: quote?.ltp || 0,
      bias: 'NEUTRAL',
      structure: {
        overallBias: 'NEUTRAL',
        overallReason: 'Market candle data unavailable',
        timeframe15m: { trend: 'NO CLEAR STRUCTURE', bos: false, choch: false },
        timeframe5m: { trend: 'NO CLEAR STRUCTURE', bos: false, choch: false }
      },
      zones: { supply: [], demand: [] },
      support: [],
      resistance: [],
      vwap: 0,
      vwapStatus: 'VWAP unavailable',
      pdh: quote?.high || 0,
      pdl: quote?.low || 0,
      previousClose: quote?.previousClose || 0,
      setup: {
        status: 'LIVE_DATA_UNAVAILABLE',
        direction: 'NONE',
        isTradeValid: false,
        qualityScore: 0,
        waitingReason: 'Required intraday market data is unavailable',
        whyReasons: ['Market provider returned empty candle data.'],
        checklist: [],
        entry: { low: 0, high: 0, trigger: 'None', confirmationNeeded: 'Live data required' },
        stopLoss: { price: 0, reason: 'Data unavailable', riskPoints: 0 },
        targets: {
          t1: { price: 0, rewardPoints: 0, rr: 0, reason: 'Data unavailable' },
          t2: { price: 0, rewardPoints: 0, rr: 0, reason: 'Data unavailable' },
          t3: { price: 0, rewardPoints: 0, rr: 0, reason: 'Data unavailable' }
        },
        riskReward: { minRequired: 1.5, t1: 0, t2: 0, t3: 0, isValid: false }
      },
      tradeManagement: {
        state: 'LIVE_DATA_UNAVAILABLE',
        stateMessage: 'Live data unavailable from provider',
        currentPrice: 0,
        distanceToStop: 0,
        distanceToT1: 0,
        distanceToT2: 0,
        distanceToT3: 0,
        exitPlan: {}
      }
    };
  }

  // Handle Market Closed
  if (!marketHours.isMarketOpen) {
    const ltp = quote.ltp;
    const structure = analyzeMarketStructure(candles15m, candles5m);
    const zones = detectSupplyAndDemandZones(candles5m, ltp, '5M');
    const levels = calculateKeyLevels(candles5m, quote);

    return {
      symbol,
      marketStatus: marketHours.status,
      dataStatus: effectiveDataStatus,
      dataSource,
      timestamp,
      dataAge,
      currentPrice: ltp,
      bias: structure.overallBias,
      structure,
      zones: { supply: zones.supplyZones, demand: zones.demandZones },
      support: levels.supportLevels,
      resistance: levels.resistanceLevels,
      vwap: levels.vwap,
      vwapStatus: levels.vwapStatus,
      pdh: levels.pdh,
      pdl: levels.pdl,
      previousClose: levels.previousClose,
      setup: {
        status: 'MARKET_CLOSED',
        direction: 'NONE',
        isTradeValid: false,
        qualityScore: 0,
        waitingReason: 'Market is currently closed (09:15 - 15:30 IST Mon-Fri). Fresh live trade setup generation paused.',
        whyReasons: ['Market session has ended. Next session opens at 09:15 AM IST.'],
        checklist: [],
        entry: { low: ltp, high: ltp, trigger: 'Market Session Closed', confirmationNeeded: 'Wait for market open' },
        stopLoss: { price: ltp, reason: 'Market closed', riskPoints: 0 },
        targets: {
          t1: { price: ltp, rewardPoints: 0, rr: 0, reason: 'Market closed' },
          t2: { price: ltp, rewardPoints: 0, rr: 0, reason: 'Market closed' },
          t3: { price: ltp, rewardPoints: 0, rr: 0, reason: 'Market closed' }
        },
        riskReward: { minRequired: 1.5, t1: 0, t2: 0, t3: 0, isValid: false }
      },
      tradeManagement: {
        state: 'MARKET_CLOSED',
        stateMessage: 'Indian Equity Market is Closed. Live execution paused.',
        currentPrice: ltp,
        distanceToStop: 0,
        distanceToT1: 0,
        distanceToT2: 0,
        distanceToT3: 0,
        exitPlan: {}
      }
    };
  }

  // Live Market Analysis
  const ltp = quote.ltp;
  const structure = analyzeMarketStructure(candles15m, candles5m);
  const zones = detectSupplyAndDemandZones(candles5m, ltp, '5M');
  const levels = calculateKeyLevels(candles5m, quote);

  const setup = evaluateSetup(symbol, quote, structure, zones, levels, candles5m);
  const tradeManagement = evaluateTradeManagement(symbol, ltp, setup.status, setup);

  return {
    symbol,
    marketStatus: marketHours.status,
    dataStatus: effectiveDataStatus,
    dataSource,
    timestamp,
    dataAge,
    currentPrice: ltp,
    bias: structure.overallBias,
    structure,
    zones: {
      supply: zones.supplyZones,
      demand: zones.demandZones
    },
    support: levels.supportLevels,
    resistance: levels.resistanceLevels,
    vwap: levels.vwap,
    vwapStatus: levels.vwapStatus,
    pdh: levels.pdh,
    pdl: levels.pdl,
    previousClose: levels.previousClose,
    setup,
    tradeManagement,
    exitPlan: tradeManagement.exitPlan
  };
}

module.exports = {
  generateIntradayTradePlan
};
