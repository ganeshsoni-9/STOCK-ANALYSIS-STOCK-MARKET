/**
 * Dynamic Supply and Demand Zone Engine
 * Identifies supply & demand zones objectively from historical candle formations.
 * Calculates zoneLow, zoneHigh, timeframe, type (DEMAND | SUPPLY), strength (0-100),
 * freshness, touches, reactionStrength, distanceFromPrice, and reason.
 */

function detectSupplyAndDemandZones(candles, currentPrice, timeframe = '5M') {
  if (!candles || candles.length < 15) {
    return { supplyZones: [], demandZones: [] };
  }

  const demandZones = [];
  const supplyZones = [];

  // Look for impulsive displacement candles (large body candles)
  const avgRange = candles.reduce((acc, c) => acc + (c.high - c.low), 0) / candles.length;

  for (let i = 2; i < candles.length - 2; i++) {
    const prevCandle = candles[i - 1];
    const currCandle = candles[i];
    const nextCandle = candles[i + 1];

    const bodySize = Math.abs(currCandle.close - currCandle.open);
    const isImpulsive = bodySize > (avgRange * 1.2);

    // Bullish Impulse -> Demand Zone candidate at base (prevCandle)
    if (isImpulsive && currCandle.close > currCandle.open && nextCandle.close >= currCandle.close * 0.999) {
      const zoneLow = Number(Math.min(prevCandle.low, currCandle.low).toFixed(2));
      const zoneHigh = Number(Math.max(prevCandle.open, prevCandle.close, currCandle.open).toFixed(2));

      if (zoneHigh > zoneLow && currentPrice >= zoneLow * 0.97) {
        // Count touches & freshness
        let touches = 0;
        let lowestPriceAfter = Infinity;
        for (let j = i + 1; j < candles.length; j++) {
          if (candles[j].low <= zoneHigh && candles[j].high >= zoneLow) {
            touches++;
          }
          if (candles[j].low < lowestPriceAfter) lowestPriceAfter = candles[j].low;
        }

        const isBroken = lowestPriceAfter < zoneLow;

        if (!isBroken) {
          const freshness = touches === 0 ? 'FRESH' : touches <= 2 ? 'TESTED' : 'WEAK';
          const distPct = Number((Math.abs(currentPrice - zoneHigh) / currentPrice * 100).toFixed(2));
          const strength = Math.min(100, Math.round((freshness === 'FRESH' ? 85 : freshness === 'TESTED' ? 65 : 45) + (bodySize / avgRange * 10) - (touches * 10)));

          demandZones.push({
            id: `demand_${timeframe}_${i}`,
            zoneLow,
            zoneHigh,
            timeframe,
            type: 'DEMAND',
            strength: Math.max(30, strength),
            freshness,
            touches,
            reactionStrength: Number((bodySize / avgRange).toFixed(2)),
            distanceFromPrice: distPct,
            reason: `${freshness} Demand Zone created after strong bullish displacement (+${Number(((currCandle.close - currCandle.open) / currCandle.open * 100).toFixed(2))}%)`
          });
        }
      }
    }

    // Bearish Impulse -> Supply Zone candidate at base (prevCandle)
    if (isImpulsive && currCandle.close < currCandle.open && nextCandle.close <= currCandle.close * 1.001) {
      const zoneHigh = Number(Math.max(prevCandle.high, currCandle.high).toFixed(2));
      const zoneLow = Number(Math.min(prevCandle.open, prevCandle.close, currCandle.open).toFixed(2));

      if (zoneHigh > zoneLow && currentPrice <= zoneHigh * 1.03) {
        let touches = 0;
        let highestPriceAfter = -Infinity;
        for (let j = i + 1; j < candles.length; j++) {
          if (candles[j].high >= zoneLow && candles[j].low <= zoneHigh) {
            touches++;
          }
          if (candles[j].high > highestPriceAfter) highestPriceAfter = candles[j].high;
        }

        const isBroken = highestPriceAfter > zoneHigh;

        if (!isBroken) {
          const freshness = touches === 0 ? 'FRESH' : touches <= 2 ? 'TESTED' : 'WEAK';
          const distPct = Number((Math.abs(currentPrice - zoneLow) / currentPrice * 100).toFixed(2));
          const strength = Math.min(100, Math.round((freshness === 'FRESH' ? 85 : freshness === 'TESTED' ? 65 : 45) + (bodySize / avgRange * 10) - (touches * 10)));

          supplyZones.push({
            id: `supply_${timeframe}_${i}`,
            zoneLow,
            zoneHigh,
            timeframe,
            type: 'SUPPLY',
            strength: Math.max(30, strength),
            freshness,
            touches,
            reactionStrength: Number((bodySize / avgRange).toFixed(2)),
            distanceFromPrice: distPct,
            reason: `${freshness} Supply Zone created after strong bearish rejection (-${Number(((currCandle.open - currCandle.close) / currCandle.open * 100).toFixed(2))}%)`
          });
        }
      }
    }
  }

  // Deduplicate and sort by proximity to current price
  const uniqueDemand = filterDeduplicatedZones(demandZones, currentPrice);
  const uniqueSupply = filterDeduplicatedZones(supplyZones, currentPrice);

  return {
    demandZones: uniqueDemand.slice(0, 3),
    supplyZones: uniqueSupply.slice(0, 3)
  };
}

function filterDeduplicatedZones(zones, currentPrice) {
  const sorted = [...zones].sort((a, b) => Math.abs(a.zoneHigh - currentPrice) - Math.abs(b.zoneHigh - currentPrice));
  const result = [];
  for (const z of sorted) {
    const isOverlap = result.some(r => Math.abs(r.zoneLow - z.zoneLow) / z.zoneLow < 0.003);
    if (!isOverlap) result.push(z);
  }
  return result;
}

module.exports = {
  detectSupplyAndDemandZones
};
