/**
 * Intraday Setup Engine
 * Evaluates trade setup conditions for LONG and SHORT.
 * Produces:
 * - Entry checklist with exact boolean met/unmet states and explicit waiting reasons
 * - Dynamic Entry Zone (entryLow, entryHigh), Trigger, Confirmation
 * - Structural Stop Loss + reason
 * - Dynamic Targets T1, T2, T3 + reasons
 * - Risk / Reward for T1, T2, T3 & minimum threshold check (MIN_RISK_REWARD = 1.5)
 * - Technical Setup Quality Score (0-100, purely technical quality, NOT profit probability)
 * - Transparent "Why This Setup?" or "Why Wait?" / "No Trade Reason" breakdown.
 */

const MIN_RISK_REWARD = 1.5;

function evaluateSetup(symbol, currentQuote, structure, zones, levels, candles5m) {
  const ltp = currentQuote.ltp;
  const bias = structure.overallBias;
  const demandZones = zones.demandZones || [];
  const supplyZones = zones.supplyZones || [];

  const activeDemand = demandZones.find(z => ltp >= z.zoneLow * 0.998 && ltp <= z.zoneHigh * 1.005) || demandZones[0];
  const activeSupply = supplyZones.find(z => ltp <= z.zoneHigh * 1.002 && ltp >= z.zoneLow * 0.995) || supplyZones[0];

  const lastCandle = candles5m && candles5m.length > 0 ? candles5m[candles5m.length - 1] : null;
  const prevCandle = candles5m && candles5m.length > 1 ? candles5m[candles5m.length - 2] : null;

  // Bullish Rejection check: lower wick on recent candle
  let bullishRejection = false;
  if (lastCandle) {
    const range = lastCandle.high - lastCandle.low;
    const lowerWick = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;
    if (range > 0 && (lowerWick / range) >= 0.35) bullishRejection = true;
  }

  // Bearish Rejection check: upper wick on recent candle
  let bearishRejection = false;
  if (lastCandle) {
    const range = lastCandle.high - lastCandle.low;
    const upperWick = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
    if (range > 0 && (upperWick / range) >= 0.35) bearishRejection = true;
  }

  // Checklist evaluation
  const inDemandZone = !!(activeDemand && ltp >= activeDemand.zoneLow * 0.995 && ltp <= activeDemand.zoneHigh * 1.01);
  const inSupplyZone = !!(activeSupply && ltp <= activeSupply.zoneHigh * 1.005 && ltp >= activeSupply.zoneLow * 0.99);

  const tf15mBullish = structure.timeframe15m.trend === 'BULLISH';
  const tf15mBearish = structure.timeframe15m.trend === 'BEARISH';
  const higherLowFormed = structure.timeframe5m.trend === 'BULLISH' || (structure.timeframe5m.prevSwingLow && ltp > structure.timeframe5m.prevSwingLow);
  const lowerHighFormed = structure.timeframe5m.trend === 'BEARISH' || (structure.timeframe5m.prevSwingHigh && ltp < structure.timeframe5m.prevSwingHigh);
  const minorBOS = structure.timeframe5m.bos;
  const vwapSupport = levels.vwap > 0 ? (bias === 'BULLISH' ? ltp >= levels.vwap * 0.998 : ltp <= levels.vwap * 1.002) : true;

  // Determine setup direction
  let direction = 'NONE';
  if (bias === 'BULLISH' || (inDemandZone && bullishRejection)) {
    direction = 'LONG';
  } else if (bias === 'BEARISH' || (inSupplyZone && bearishRejection)) {
    direction = 'SHORT';
  }

  // If choppy / no structure and not in zone
  if (structure.overallBias === 'CHOPPY / NO CLEAR STRUCTURE' && !inDemandZone && !inSupplyZone) {
    direction = 'NONE';
  }

  // Build Checklist
  const checklist = [];
  let waitingReason = '';

  if (direction === 'LONG') {
    checklist.push({ title: 'Higher-timeframe (15M) Bullish Context', met: tf15mBullish, detail: tf15mBullish ? '15M structure is bullish' : '15M structure is neutral/mixed' });
    checklist.push({ title: 'Price in Demand Zone / Retest Area', met: inDemandZone, detail: inDemandZone ? `Inside demand zone (₹${activeDemand?.zoneLow} - ₹${activeDemand?.zoneHigh})` : 'Price has not reached demand zone' });
    checklist.push({ title: '5M Bullish Candle Rejection', met: bullishRejection, detail: bullishRejection ? 'Bullish lower wick rejection candle detected' : 'Waiting for bullish rejection candle' });
    checklist.push({ title: 'Higher Low Structural Confirmation', met: higherLowFormed, detail: higherLowFormed ? 'Higher Low point established on 5M' : 'Waiting for Higher Low structural pivot' });
    checklist.push({ title: 'Minor Bullish BOS Confirmed', met: minorBOS, detail: minorBOS ? '5M Break of Structure confirmed' : 'Waiting for 5M Break of Structure (BOS)' });
    checklist.push({ title: 'VWAP Alignment', met: vwapSupport, detail: vwapSupport ? 'Price supported above/at VWAP' : 'Price below VWAP baseline' });

    const unmet = checklist.filter(c => !c.met);
    if (unmet.length > 0) {
      waitingReason = `Waiting for: ${unmet.map(u => u.title).join(', ')}`;
    }
  } else if (direction === 'SHORT') {
    checklist.push({ title: 'Higher-timeframe (15M) Bearish Context', met: tf15mBearish, detail: tf15mBearish ? '15M structure is bearish' : '15M structure is neutral/mixed' });
    checklist.push({ title: 'Price in Supply Zone / Retest Area', met: inSupplyZone, detail: inSupplyZone ? `Inside supply zone (₹${activeSupply?.zoneLow} - ₹${activeSupply?.zoneHigh})` : 'Price has not reached supply zone' });
    checklist.push({ title: '5M Bearish Candle Rejection', met: bearishRejection, detail: bearishRejection ? 'Bearish upper wick rejection candle detected' : 'Waiting for bearish rejection candle' });
    checklist.push({ title: 'Lower High Structural Confirmation', met: lowerHighFormed, detail: lowerHighFormed ? 'Lower High point established on 5M' : 'Waiting for Lower High structural pivot' });
    checklist.push({ title: 'Minor Bearish BOS Confirmed', met: minorBOS, detail: minorBOS ? '5M Break of Structure confirmed' : 'Waiting for 5M Break of Structure (BOS)' });
    checklist.push({ title: 'VWAP Alignment', met: vwapSupport, detail: vwapSupport ? 'Price resistance below/at VWAP' : 'Price above VWAP baseline' });

    const unmet = checklist.filter(c => !c.met);
    if (unmet.length > 0) {
      waitingReason = `Waiting for: ${unmet.map(u => u.title).join(', ')}`;
    }
  } else {
    waitingReason = 'Market structure is choppy without clear supply/demand reaction';
  }

  // Calculate Entry Zone, Stop Loss & Targets if direction exists
  let entryLow = ltp;
  let entryHigh = ltp;
  let trigger = '5M Confirmation';
  let stopLoss = ltp;
  let slReason = '';
  let t1 = ltp, t2 = ltp, t3 = ltp;
  let t1Reason = '', t2Reason = '', t3Reason = '';

  if (direction === 'LONG') {
    if (activeDemand) {
      entryLow = Number((activeDemand.zoneLow).toFixed(2));
      entryHigh = Number((activeDemand.zoneHigh).toFixed(2));
      stopLoss = Number((activeDemand.zoneLow * 0.997).toFixed(2)); // Buffer below demand zone
      slReason = `Below Demand Zone (₹${activeDemand.zoneLow})`;
    } else {
      entryLow = Number((ltp * 0.998).toFixed(2));
      entryHigh = Number((ltp * 1.001).toFixed(2));
      stopLoss = Number((structure.timeframe5m.lastSwingLow ? structure.timeframe5m.lastSwingLow * 0.998 : ltp * 0.994).toFixed(2));
      slReason = 'Below 5M swing low structural invalidation level';
    }
    trigger = '5M Bullish BOS or Reversal Confirmation';

    const res1 = levels.resistanceLevels[0] || (ltp * 1.008);
    const res2 = levels.resistanceLevels[1] || (ltp * 1.015);
    const res3 = levels.resistanceLevels[2] || (ltp * 1.025);

    t1 = Number(res1.toFixed(2));
    t1Reason = 'Nearest intraday resistance level';

    t2 = Number(Math.max(res2, levels.pdh).toFixed(2));
    t2Reason = 'Previous Day High / Secondary resistance zone';

    t3 = Number(Math.max(res3, t2 * 1.008).toFixed(2));
    t3Reason = 'Extended intraday structural expansion target';

  } else if (direction === 'SHORT') {
    if (activeSupply) {
      entryLow = Number((activeSupply.zoneLow).toFixed(2));
      entryHigh = Number((activeSupply.zoneHigh).toFixed(2));
      stopLoss = Number((activeSupply.zoneHigh * 1.003).toFixed(2)); // Buffer above supply zone
      slReason = `Above Supply Zone (₹${activeSupply.zoneHigh})`;
    } else {
      entryLow = Number((ltp * 0.999).toFixed(2));
      entryHigh = Number((ltp * 1.002).toFixed(2));
      stopLoss = Number((structure.timeframe5m.lastSwingHigh ? structure.timeframe5m.lastSwingHigh * 1.002 : ltp * 1.006).toFixed(2));
      slReason = 'Above 5M swing high structural invalidation level';
    }
    trigger = '5M Bearish BOS or Reversal Confirmation';

    const sup1 = levels.supportLevels[0] || (ltp * 0.992);
    const sup2 = levels.supportLevels[1] || (ltp * 0.985);
    const sup3 = levels.supportLevels[2] || (ltp * 0.975);

    t1 = Number(sup1.toFixed(2));
    t1Reason = 'Nearest intraday support level';

    t2 = Number(Math.min(sup2, levels.pdl).toFixed(2));
    t2Reason = 'Previous Day Low / Secondary support zone';

    t3 = Number(Math.min(sup3, t2 * 0.992).toFixed(2));
    t3Reason = 'Extended intraday structural downside expansion target';
  }

  // Calculate Risk / Reward
  const riskPoints = Number(Math.abs(ltp - stopLoss).toFixed(2));
  const t1RewardPoints = Number(Math.abs(t1 - ltp).toFixed(2));
  const t2RewardPoints = Number(Math.abs(t2 - ltp).toFixed(2));
  const t3RewardPoints = Number(Math.abs(t3 - ltp).toFixed(2));

  const rrT1 = riskPoints > 0 ? Number((t1RewardPoints / riskPoints).toFixed(2)) : 0;
  const rrT2 = riskPoints > 0 ? Number((t2RewardPoints / riskPoints).toFixed(2)) : 0;
  const rrT3 = riskPoints > 0 ? Number((t3RewardPoints / riskPoints).toFixed(2)) : 0;

  // Determine Setup Status
  let setupStatus = 'WAITING_FOR_CONFIRMATION';
  let isTradeValid = false;

  const metCount = checklist.filter(c => c.met).length;
  const totalCheck = checklist.length;

  if (direction === 'NONE' || totalCheck === 0) {
    setupStatus = 'NO_HIGH_QUALITY_SETUP';
  } else if (metCount >= 4 && (rrT2 >= MIN_RISK_REWARD || rrT1 >= 1.2)) {
    setupStatus = 'ENTRY_CONDITION_MET';
    isTradeValid = true;
  } else if (rrT2 < MIN_RISK_REWARD && rrT1 < 1.0) {
    setupStatus = 'NO_HIGH_QUALITY_SETUP';
    waitingReason = `Risk/Reward below minimum requirement (${rrT2} < ${MIN_RISK_REWARD})`;
  } else {
    setupStatus = 'WAITING_FOR_CONFIRMATION';
  }

  // Quality Score Weighting (Total 100)
  // Structure: 25, Zone: 20, Momentum: 15, Volume: 15, VWAP: 10, Confirmation: 15
  let qualityScore = 0;
  if (structure.overallBias !== 'CHOPPY / NO CLEAR STRUCTURE') qualityScore += 25;
  if (inDemandZone || inSupplyZone) qualityScore += 20;
  if (bullishRejection || bearishRejection) qualityScore += 15;
  if (currentQuote.volume > 0) qualityScore += 15;
  if (vwapSupport) qualityScore += 10;
  qualityScore += Math.round((metCount / Math.max(1, totalCheck)) * 15);

  qualityScore = Math.min(95, Math.max(15, qualityScore));

  // Formulate "Why This Setup?" reasons
  const whyReasons = [];
  if (direction === 'LONG') {
    whyReasons.push(`15M Market structure is ${structure.timeframe15m.trend.toLowerCase()}.`);
    if (inDemandZone) whyReasons.push(`Price reacted from ${activeDemand.freshness.toLowerCase()} demand zone (₹${activeDemand.zoneLow} - ₹${activeDemand.zoneHigh}).`);
    if (bullishRejection) whyReasons.push('Bullish lower wick rejection candle detected on 5M timeframe.');
    if (minorBOS) whyReasons.push('Minor 5M Break of Structure (BOS) confirmed.');
    if (vwapSupport) whyReasons.push('Price is trading above/at intraday VWAP line.');
    whyReasons.push(`Acceptable risk/reward ratio available to Target 2 (1:${rrT2}).`);
    whyReasons.push(`Structural invalidation defined strictly below SL at ₹${stopLoss}.`);
  } else if (direction === 'SHORT') {
    whyReasons.push(`15M Market structure is ${structure.timeframe15m.trend.toLowerCase()}.`);
    if (inSupplyZone) whyReasons.push(`Price rejected from ${activeSupply.freshness.toLowerCase()} supply zone (₹${activeSupply.zoneLow} - ₹${activeSupply.zoneHigh}).`);
    if (bearishRejection) whyReasons.push('Bearish upper wick rejection candle detected on 5M timeframe.');
    if (minorBOS) whyReasons.push('Minor 5M Break of Structure (BOS) confirmed.');
    if (vwapSupport) whyReasons.push('Price is trading below/at intraday VWAP line.');
    whyReasons.push(`Acceptable risk/reward ratio available to Target 2 (1:${rrT2}).`);
    whyReasons.push(`Structural invalidation defined strictly above SL at ₹${stopLoss}.`);
  } else {
    whyReasons.push('No high quality setup detected due to choppy rangebound market structure.');
  }

  return {
    status: setupStatus,
    direction,
    isTradeValid,
    qualityScore,
    waitingReason,
    whyReasons,
    checklist,
    entry: {
      low: entryLow,
      high: entryHigh,
      trigger,
      confirmationNeeded: waitingReason || '5M Candle Close + BOS'
    },
    stopLoss: {
      price: stopLoss,
      reason: slReason,
      riskPoints
    },
    targets: {
      t1: { price: t1, rewardPoints: t1RewardPoints, rr: rrT1, reason: t1Reason },
      t2: { price: t2, rewardPoints: t2RewardPoints, rr: rrT2, reason: t2Reason },
      t3: { price: t3, rewardPoints: t3RewardPoints, rr: rrT3, reason: t3Reason }
    },
    riskReward: {
      minRequired: MIN_RISK_REWARD,
      t1: rrT1,
      t2: rrT2,
      t3: rrT3,
      isValid: rrT2 >= MIN_RISK_REWARD || rrT1 >= 1.2
    }
  };
}

module.exports = {
  evaluateSetup
};
