/**
 * Trade Management & Exit Plan Engine
 * Tracks active trade state and provides dynamic distances to SL/T1/T2/T3.
 * Evaluates 6 explicit Exit Conditions.
 */

function evaluateTradeManagement(symbol, currentPrice, setupStatus, setup) {
  const isLong = setup.direction === 'LONG';
  const isShort = setup.direction === 'SHORT';

  const slPrice = setup.stopLoss?.price || currentPrice;
  const t1Price = setup.targets?.t1?.price || currentPrice;
  const t2Price = setup.targets?.t2?.price || currentPrice;
  const t3Price = setup.targets?.t3?.price || currentPrice;

  // Calculate dynamic distances
  const distanceToStop = Number(Math.abs(currentPrice - slPrice).toFixed(2));
  const distanceToT1 = Number(Math.abs(t1Price - currentPrice).toFixed(2));
  const distanceToT2 = Number(Math.abs(t2Price - currentPrice).toFixed(2));
  const distanceToT3 = Number(Math.abs(t3Price - currentPrice).toFixed(2));

  let state = 'WAITING_FOR_SETUP';
  let stateMessage = 'Waiting for high quality structural setup';

  if (setupStatus === 'MARKET_CLOSED') {
    state = 'MARKET_CLOSED';
    stateMessage = 'Indian Equity Market is Closed';
  } else if (setupStatus === 'LIVE_DATA_UNAVAILABLE') {
    state = 'LIVE_DATA_UNAVAILABLE';
    stateMessage = 'Live market data feed is currently unavailable';
  } else if (setup.direction === 'NONE') {
    state = 'NO_HIGH_QUALITY_SETUP';
    stateMessage = setup.waitingReason || 'No high-quality setup detected';
  } else if (setupStatus === 'WAITING_FOR_CONFIRMATION') {
    state = 'WAITING_FOR_CONFIRMATION';
    stateMessage = setup.waitingReason || 'Waiting for entry confirmation checklist';
  } else if (setupStatus === 'ENTRY_CONDITION_MET') {
    // Check if price reached targets or SL
    if (isLong) {
      if (currentPrice <= slPrice) {
        state = 'STOP_LOSS_HIT';
        stateMessage = `Stop Loss condition reached at ₹${currentPrice} (SL level: ₹${slPrice})`;
      } else if (currentPrice >= t3Price) {
        state = 'T3_HIT';
        stateMessage = `Target 3 reached at ₹${currentPrice}! Intraday plan completed.`;
      } else if (currentPrice >= t2Price) {
        state = 'T2_HIT';
        stateMessage = `Target 2 reached at ₹${currentPrice}! Move SL to Break-Even/T1.`;
      } else if (currentPrice >= t1Price) {
        state = 'T1_HIT';
        stateMessage = `Target 1 reached at ₹${currentPrice}! Partial exit recommended.`;
      } else {
        state = 'ENTRY_CONDITION_MET';
        stateMessage = 'Technical entry conditions satisfied. Setup is active.';
      }
    } else if (isShort) {
      if (currentPrice >= slPrice) {
        state = 'STOP_LOSS_HIT';
        stateMessage = `Stop Loss condition reached at ₹${currentPrice} (SL level: ₹${slPrice})`;
      } else if (currentPrice <= t3Price) {
        state = 'T3_HIT';
        stateMessage = `Target 3 reached at ₹${currentPrice}! Intraday plan completed.`;
      } else if (currentPrice <= t2Price) {
        state = 'T2_HIT';
        stateMessage = `Target 2 reached at ₹${currentPrice}! Move SL to Break-Even/T1.`;
      } else if (currentPrice <= t1Price) {
        state = 'T1_HIT';
        stateMessage = `Target 1 reached at ₹${currentPrice}! Partial exit recommended.`;
      } else {
        state = 'ENTRY_CONDITION_MET';
        stateMessage = 'Technical entry conditions satisfied. Setup is active.';
      }
    }
  }

  // Dedicated Exit Plan with 6 explicit conditions
  const exitPlan = {
    exitCondition1: {
      name: 'STOP LOSS',
      triggerPrice: slPrice,
      triggered: state === 'STOP_LOSS_HIT',
      description: `Exit trade immediately if price hits ₹${slPrice} (${setup.stopLoss?.reason || 'Structural Invalidation'})`
    },
    exitCondition2: {
      name: 'TARGET 1',
      triggerPrice: t1Price,
      triggered: state === 'T1_HIT' || state === 'T2_HIT' || state === 'T3_HIT',
      description: `Reach T1 at ₹${t1Price} (R:R 1:${setup.targets?.t1?.rr || '1.2'}) for 50% partial profit booking`
    },
    exitCondition3: {
      name: 'TARGET 2',
      triggerPrice: t2Price,
      triggered: state === 'T2_HIT' || state === 'T3_HIT',
      description: `Reach T2 at ₹${t2Price} (R:R 1:${setup.targets?.t2?.rr || '2.0'}) for secondary target booking`
    },
    exitCondition4: {
      name: 'TARGET 3',
      triggerPrice: t3Price,
      triggered: state === 'T3_HIT',
      description: `Reach T3 at ₹${t3Price} (R:R 1:${setup.targets?.t3?.rr || '3.0'}) for final runner position exit`
    },
    exitCondition5: {
      name: 'STRUCTURE INVALIDATION',
      triggerPrice: slPrice,
      triggered: state === 'STOP_LOSS_HIT',
      description: `Exit if 5M market structure flips against direction (${isLong ? 'Bearish BOS' : 'Bullish BOS'})`
    },
    exitCondition6: {
      name: 'SETUP FAILURE / TIME EXIT',
      triggerPrice: null,
      triggered: false,
      description: 'Exit all intraday positions before 03:15 PM IST regardless of target/SL'
    }
  };

  return {
    state,
    stateMessage,
    currentPrice,
    distanceToStop,
    distanceToT1,
    distanceToT2,
    distanceToT3,
    exitPlan
  };
}

module.exports = {
  evaluateTradeManagement
};
