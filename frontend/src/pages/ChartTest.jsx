import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, ColorType } from 'lightweight-charts';

export default function ChartTest() {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const sampleData = [
      { time: '2026-09-01', open: 100.0, high: 105.5, low: 98.2, close: 103.4 },
      { time: '2026-09-02', open: 103.4, high: 108.0, low: 101.5, close: 106.8 },
      { time: '2026-09-03', open: 106.8, high: 107.2, low: 102.0, close: 102.5 },
      { time: '2026-09-04', open: 102.5, high: 104.0, low: 99.1, close: 101.0 },
      { time: '2026-09-05', open: 101.0, high: 106.5, low: 100.5, close: 105.2 },
      { time: '2026-09-06', open: 105.2, high: 110.0, low: 104.8, close: 109.5 },
      { time: '2026-09-07', open: 109.5, high: 111.2, low: 106.0, close: 107.0 },
      { time: '2026-09-08', open: 107.0, high: 107.8, low: 103.2, close: 104.5 },
      { time: '2026-09-09', open: 104.5, high: 109.0, low: 104.0, close: 108.3 },
      { time: '2026-09-10', open: 108.3, high: 112.5, low: 107.5, close: 111.8 },
      { time: '2026-09-11', open: 111.8, high: 113.0, low: 108.0, close: 108.5 },
      { time: '2026-09-12', open: 108.5, high: 114.2, low: 108.0, close: 113.6 }
    ];

    const chart = createChart(chartContainerRef.current, {
      width: 800,
      height: 500,
      layout: {
        background: { type: ColorType.Solid, color: '#0F172A' },
        textColor: '#F8FAFC'
      },
      grid: {
        vertLines: { color: '#1E293B' },
        horzLines: { color: '#1E293B' }
      }
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444'
    });

    candlestickSeries.setData(sampleData);
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#10B981', marginBottom: '10px' }}>
        Standalone Lightweight-Charts Isolation Test
      </h2>
      <p style={{ color: '#94A3B8', marginBottom: '20px', fontSize: '14px' }}>
        Testing 12 hardcoded OHLC sample candles in fixed 800x500 container.
      </p>
      <div
        ref={chartContainerRef}
        style={{
          width: '800px',
          height: '500px',
          border: '1px solid #334155',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      />
    </div>
  );
}
