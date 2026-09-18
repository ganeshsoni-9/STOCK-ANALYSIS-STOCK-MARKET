import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, ColorType, CrosshairMode } from 'lightweight-charts';

export default function CandlestickChart({ series = [], height = 300 }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const [legendData, setLegendData] = useState(null);

  // Format raw candles into lightweight-charts format
  const formatCandleData = (rawSeries) => {
    if (!Array.isArray(rawSeries)) return { candles: [], volume: [] };

    const candles = [];
    const volume = [];
    const seenTimes = new Set();

    for (const item of rawSeries) {
      if (!item || !item.timestamp) continue;
      const open = Number(item.open);
      const high = Number(item.high);
      const low = Number(item.low);
      const close = Number(item.close);

      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue;

      let timeInSeconds;
      if (typeof item.timestamp === 'number') {
        timeInSeconds = item.timestamp > 2000000000 ? Math.floor(item.timestamp / 1000) : item.timestamp;
      } else {
        timeInSeconds = Math.floor(new Date(item.timestamp).getTime() / 1000);
      }

      if (isNaN(timeInSeconds) || timeInSeconds <= 0) continue;

      if (!seenTimes.has(timeInSeconds)) {
        seenTimes.add(timeInSeconds);
        const isBullish = close >= open;

        candles.push({
          time: timeInSeconds,
          open,
          high,
          low,
          close,
          rawTimestamp: item.timestamp
        });

        if (typeof item.volume === 'number' && !isNaN(item.volume)) {
          volume.push({
            time: timeInSeconds,
            value: item.volume,
            color: isBullish ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
          });
        }
      }
    }

    // Sort strictly ascending by time (required by lightweight-charts)
    candles.sort((a, b) => a.time - b.time);
    volume.sort((a, b) => a.time - b.time);

    return { candles, volume };
  };

  // Initialize Chart ONCE on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth || 600,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94A3B8',
        fontSize: 11,
        fontFamily: 'monospace'
      },
      grid: {
        vertLines: { color: '#1E293B' },
        horzLines: { color: '#1E293B' }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#475569',
          width: 1,
          style: 3, // Dashed
          labelBackgroundColor: '#0F172A'
        },
        horzLine: {
          color: '#475569',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0F172A'
        }
      },
      rightPriceScale: {
        borderColor: '#334155',
        scaleMargins: {
          top: 0.05,
          bottom: 0.25 // Leave bottom 25% empty for separate volume strip
        }
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false
      }
    });

    chartRef.current = chart;

    // Add Candlestick Series using lightweight-charts v4 API
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444'
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Add Volume Histogram Series on an independent 'volume' price scale
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume'
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8, // Volume bars stay strictly in bottom 20% strip
        bottom: 0
      }
    });
    volumeSeriesRef.current = volumeSeries;

    // Subscribe to Crosshair Move for custom Legend/Tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData || param.point === undefined || param.point.x < 0 || param.point.y < 0) {
        setLegendData(null);
        return;
      }

      const candleData = param.seriesData.get(candlestickSeries);
      const volData = param.seriesData.get(volumeSeries);

      if (candleData) {
        const timeStr = typeof param.time === 'number'
          ? new Date(param.time * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
          : String(param.time);

        setLegendData({
          time: timeStr,
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volData ? volData.value : null
        });
      }
    });

    // ResizeObserver for responsiveness
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: newWidth, height: newHeight } = entries[0].contentRect;
      if (newWidth > 0) {
        chart.applyOptions({
          width: newWidth,
          height: newHeight > 0 ? newHeight : height
        });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []); // Run once on mount

  // Update Data smoothly whenever `series` changes (e.g. timeframe switch)
  useEffect(() => {
    if (!candlestickSeriesRef.current || !chartRef.current) return;

    const { candles, volume } = formatCandleData(series);

    if (candles.length > 0) {
      candlestickSeriesRef.current.setData(candles);
      if (volumeSeriesRef.current && volume.length > 0) {
        volumeSeriesRef.current.setData(volume);
      }

      // Auto-fit content on data load
      chartRef.current.timeScale().fitContent();

      // Set initial legend to last candle
      const lastCandle = candles[candles.length - 1];
      const lastVol = volume[volume.length - 1];
      const timeStr = new Date(lastCandle.time * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      setLegendData({
        time: timeStr,
        open: lastCandle.open,
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close,
        volume: lastVol ? lastVol.value : null
      });
    }
  }, [series]);

  // Determine change for legend
  const isBullish = legendData ? legendData.close >= legendData.open : true;
  const priceDiff = legendData ? legendData.close - legendData.open : 0;
  const percentDiff = legendData && legendData.open ? ((priceDiff / legendData.open) * 100).toFixed(2) : '0.00';

  return (
    <div className="relative w-full h-full min-h-[300px] flex flex-col justify-between">
      {/* Interactive OHLC Legend Bar */}
      <div className="absolute top-2 left-2 z-10 bg-[#0F172A]/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-mono flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-300 shadow-xl pointer-events-none">
        {legendData ? (
          <>
            <span className="text-slate-400 font-sans">
              Time: <strong className="text-slate-200">{legendData.time}</strong>
            </span>
            <span>
              O: <strong className="text-slate-200">₹{legendData.open.toFixed(2)}</strong>
            </span>
            <span>
              H: <strong className="text-emerald-400">₹{legendData.high.toFixed(2)}</strong>
            </span>
            <span>
              L: <strong className="text-rose-400">₹{legendData.low.toFixed(2)}</strong>
            </span>
            <span>
              C: <strong className="text-slate-200">₹{legendData.close.toFixed(2)}</strong>
            </span>
            <span className={`font-bold ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isBullish ? '+' : ''}{priceDiff.toFixed(2)} ({isBullish ? '+' : ''}{percentDiff}%)
            </span>
            {legendData.volume !== null && legendData.volume !== undefined && (
              <span className="text-slate-400">
                Vol: <strong className="text-slate-300">{legendData.volume.toLocaleString('en-IN')}</strong>
              </span>
            )}
          </>
        ) : (
          <span className="text-slate-500">Hover over chart for OHLC details</span>
        )}
      </div>

      {/* Chart Canvas Container */}
      <div ref={chartContainerRef} className="w-full h-full min-h-[300px]" />
    </div>
  );
}
