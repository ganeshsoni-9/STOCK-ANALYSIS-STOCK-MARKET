import React from 'react';

export default function OptionChainTable({ chain = [], atmStrike, onSelectContract }) {
  if (!chain || chain.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs glass-card">
        No option chain strikes available for this expiry.
      </div>
    );
  }

  const formatNumber = (val) => {
    if (val === null || val === undefined || val === 'N/A') return '--';
    return typeof val === 'number' ? val.toLocaleString('en-IN') : val;
  };

  const formatPrice = (val) => {
    if (val === null || val === undefined || val === 'N/A') return '--';
    return typeof val === 'number' ? `₹${val.toFixed(2)}` : val;
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Table Title Bar */}
      <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between font-mono text-xs">
        <div className="text-rose-400 font-bold uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
          CALLS (CE)
        </div>
        <div className="text-amber-400 font-bold uppercase tracking-wider">
          STRIKE PRICE
        </div>
        <div className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
          PUTS (PE)
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
        </div>
      </div>

      {/* Table Body Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 border-collapse min-w-[950px]">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] font-mono tracking-wider uppercase text-slate-400 bg-slate-900/90 text-center">
              {/* CALLS HEADER */}
              <th className="py-2 px-2 text-left">Call OI</th>
              <th className="py-2 px-2">OI Chg</th>
              <th className="py-2 px-2">Volume</th>
              <th className="py-2 px-2">IV %</th>
              <th className="py-2 px-2">LTP (₹)</th>
              <th className="py-2 px-2">Bid</th>
              <th className="py-2 px-2">Ask</th>

              {/* CENTER STRIKE HEADER */}
              <th className="py-2 px-3 bg-slate-950 font-bold text-amber-400 border-x border-slate-800">
                STRIKE
              </th>

              {/* PUTS HEADER */}
              <th className="py-2 px-2">Bid</th>
              <th className="py-2 px-2">Ask</th>
              <th className="py-2 px-2">LTP (₹)</th>
              <th className="py-2 px-2">IV %</th>
              <th className="py-2 px-2">Volume</th>
              <th className="py-2 px-2">OI Chg</th>
              <th className="py-2 px-2 text-right">Put OI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-center">
            {chain.map((row) => {
              const isATM = row.strike === atmStrike || row.isATM;
              const ce = row.CE;
              const pe = row.PE;

              const callITM = row.strike < atmStrike;
              const putITM = row.strike > atmStrike;

              const cePos = (ce?.change ?? 0) >= 0;
              const pePos = (pe?.change ?? 0) >= 0;

              return (
                <tr
                  key={row.strike}
                  className={`transition-colors hover:bg-slate-800/80 ${
                    isATM
                      ? 'bg-amber-950/40 border-y-2 border-amber-500/60 font-bold'
                      : ''
                  }`}
                >
                  {/* CALL OI */}
                  <td
                    onClick={() => ce && onSelectContract && onSelectContract(ce, row.strike, 'CE')}
                    className={`py-2 px-2 text-left ${ce ? 'cursor-pointer' : 'text-slate-600'} ${
                      callITM ? 'bg-amber-950/20 text-rose-300' : 'text-slate-300'
                    }`}
                  >
                    {ce ? formatNumber(ce.oi) : '--'}
                  </td>

                  {/* CALL OI CHANGE */}
                  <td
                    onClick={() => ce && onSelectContract && onSelectContract(ce, row.strike, 'CE')}
                    className={`py-2 px-2 ${ce ? 'cursor-pointer' : 'text-slate-600'} ${
                      (ce?.oiChange || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {ce ? (ce.oiChange ? (ce.oiChange > 0 ? `+${formatNumber(ce.oiChange)}` : formatNumber(ce.oiChange)) : '0') : '--'}
                  </td>

                  {/* CALL VOLUME */}
                  <td
                    onClick={() => ce && onSelectContract && onSelectContract(ce, row.strike, 'CE')}
                    className={`py-2 px-2 text-slate-400 ${ce ? 'cursor-pointer' : 'text-slate-600'}`}
                  >
                    {ce ? formatNumber(ce.volume) : '--'}
                  </td>

                  {/* CALL IV */}
                  <td
                    onClick={() => ce && onSelectContract && onSelectContract(ce, row.strike, 'CE')}
                    className={`py-2 px-2 text-sky-400 font-semibold ${ce ? 'cursor-pointer' : 'text-slate-600'}`}
                  >
                    {ce && ce.iv ? `${ce.iv}%` : '--'}
                  </td>

                  {/* CALL LTP */}
                  <td
                    onClick={() => ce && onSelectContract && onSelectContract(ce, row.strike, 'CE')}
                    className={`py-2 px-2 font-bold ${ce ? 'cursor-pointer' : 'text-slate-600'} ${
                      cePos ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {ce ? formatPrice(ce.ltp) : '--'}
                  </td>

                  {/* CALL BID / ASK */}
                  <td className="py-2 px-2 text-slate-400 text-[10px]">
                    {ce ? formatPrice(ce.bid) : '--'}
                  </td>
                  <td className="py-2 px-2 text-slate-400 text-[10px]">
                    {ce ? formatPrice(ce.ask) : '--'}
                  </td>

                  {/* STRIKE PRICE (CENTERED) */}
                  <td
                    className={`py-2 px-3 font-black text-xs border-x border-slate-800 ${
                      isATM
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                        : 'bg-slate-950 text-amber-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{row.strike}</span>
                      {isATM && <span className="text-[9px] uppercase px-1 bg-black text-amber-300 rounded">ATM</span>}
                    </div>
                  </td>

                  {/* PUT BID / ASK */}
                  <td className="py-2 px-2 text-slate-400 text-[10px]">
                    {pe ? formatPrice(pe.bid) : '--'}
                  </td>
                  <td className="py-2 px-2 text-slate-400 text-[10px]">
                    {pe ? formatPrice(pe.ask) : '--'}
                  </td>

                  {/* PUT LTP */}
                  <td
                    onClick={() => pe && onSelectContract && onSelectContract(pe, row.strike, 'PE')}
                    className={`py-2 px-2 font-bold ${pe ? 'cursor-pointer' : 'text-slate-600'} ${
                      pePos ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {pe ? formatPrice(pe.ltp) : '--'}
                  </td>

                  {/* PUT IV */}
                  <td
                    onClick={() => pe && onSelectContract && onSelectContract(pe, row.strike, 'PE')}
                    className={`py-2 px-2 text-sky-400 font-semibold ${pe ? 'cursor-pointer' : 'text-slate-600'}`}
                  >
                    {pe && pe.iv ? `${pe.iv}%` : '--'}
                  </td>

                  {/* PUT VOLUME */}
                  <td
                    onClick={() => pe && onSelectContract && onSelectContract(pe, row.strike, 'PE')}
                    className={`py-2 px-2 text-slate-400 ${pe ? 'cursor-pointer' : 'text-slate-600'}`}
                  >
                    {pe ? formatNumber(pe.volume) : '--'}
                  </td>

                  {/* PUT OI CHANGE */}
                  <td
                    onClick={() => pe && onSelectContract && onSelectContract(pe, row.strike, 'PE')}
                    className={`py-2 px-2 ${pe ? 'cursor-pointer' : 'text-slate-600'} ${
                      (pe?.oiChange || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {pe ? (pe.oiChange ? (pe.oiChange > 0 ? `+${formatNumber(pe.oiChange)}` : formatNumber(pe.oiChange)) : '0') : '--'}
                  </td>

                  {/* PUT OI */}
                  <td
                    onClick={() => pe && onSelectContract && onSelectContract(pe, row.strike, 'PE')}
                    className={`py-2 px-2 text-right ${pe ? 'cursor-pointer' : 'text-slate-600'} ${
                      putITM ? 'bg-amber-950/20 text-emerald-300' : 'text-slate-300'
                    }`}
                  >
                    {pe ? formatNumber(pe.oi) : '--'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
