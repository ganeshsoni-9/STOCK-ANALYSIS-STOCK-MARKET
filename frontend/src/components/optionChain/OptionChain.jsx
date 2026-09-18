import React, { useState } from 'react';
import { useOptionChain } from '../../hooks/useOptionChain';
import OptionChainHeader from './OptionChainHeader';
import ExpirySelector from './ExpirySelector';
import OptionChainSummary from './OptionChainSummary';
import OptionChainTable from './OptionChainTable';
import OptionOIChart from './OptionOIChart';
import OptionContractDetails from './OptionContractDetails';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function OptionChain({ symbol }) {
  const {
    data,
    expiries,
    selectedExpiry,
    setSelectedExpiry,
    loading,
    error,
    isSupported,
    lastUpdated,
    refresh
  } = useOptionChain(symbol);

  const [selectedContract, setSelectedContract] = useState(null);

  if (!isSupported) {
    return (
      <div className="glass-card p-10 text-center space-y-3 font-mono">
        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-200">Option Chain Unavailable</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
          Option Chain is not available for <strong>{symbol}</strong>. Only liquid NSE F&O stocks and indices support stock option contracts.
        </p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="glass-card p-16 text-center space-y-3 font-mono text-xs flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="text-slate-300 font-bold">Fetching live option chain matrix for {symbol}...</span>
        <span className="text-slate-500 font-sans text-[11px]">Connecting to real-time market data feed</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="glass-card p-8 text-center space-y-3 font-mono text-xs bg-rose-950/20 border border-rose-500/30">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <div className="text-rose-300 font-bold text-sm">{error}</div>
        <p className="text-slate-400 font-sans text-xs">
          Unable to fetch live option chain stream. Please verify your connection or try refreshing.
        </p>
        <button
          onClick={refresh}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 inline-flex items-center gap-2 font-mono transition"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  const {
    underlying = {},
    status = 'LIVE',
    source = 'NSE_LIVE',
    atmStrike = 0,
    totalCallOI = 0,
    totalPutOI = 0,
    pcr = 'N/A',
    maxCallOIStrike = 0,
    maxPutOIStrike = 0,
    maxPain = 0,
    chain = []
  } = data || {};

  const handleSelectContract = (contract, strike, type) => {
    if (!contract || !contract.ltp) return;
    setSelectedContract({
      contract,
      strike,
      type,
      expiry: selectedExpiry
    });
  };

  return (
    <div className="space-y-4">
      {/* Option Chain Header */}
      <OptionChainHeader
        symbol={symbol}
        underlying={underlying}
        status={status}
        source={source}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
      />

      {/* Expiry Selector Bar */}
      <div className="glass-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <ExpirySelector
          expiries={expiries}
          selectedExpiry={selectedExpiry}
          onExpiryChange={setSelectedExpiry}
        />

        <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> ATM Strike
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-950 border border-amber-500/40"></span> ITM Shading
          </span>
        </div>
      </div>

      {/* Option Chain Summary Cards */}
      <OptionChainSummary
        summary={{
          underlyingLtp: underlying.ltp,
          atmStrike,
          selectedExpiry,
          totalCallOI,
          totalPutOI,
          pcr,
          maxCallOIStrike,
          maxPutOIStrike,
          maxPain
        }}
      />

      {/* Option Chain Table */}
      <OptionChainTable
        chain={chain}
        atmStrike={atmStrike}
        onSelectContract={handleSelectContract}
      />

      {/* Open Interest & Volume Chart */}
      <OptionOIChart
        chain={chain}
        atmStrike={atmStrike}
      />

      {/* Selected Contract Modal */}
      {selectedContract && (
        <OptionContractDetails
          contract={selectedContract.contract}
          strike={selectedContract.strike}
          type={selectedContract.type}
          expiry={selectedContract.expiry}
          isOpen={!!selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      )}
    </div>
  );
}
