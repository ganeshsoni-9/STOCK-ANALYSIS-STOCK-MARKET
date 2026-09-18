import React, { useState, useEffect, useRef } from 'react';
import { Calendar, AlertCircle, Check } from 'lucide-react';
import { formatIsoToDdMmYyyy, parseUserDateToIso } from '../../utils/dateUtils';

export default function ExpirySelector({ expiries = [], selectedExpiry, onExpiryChange }) {
  const [inputText, setInputText] = useState('');
  const [validationError, setValidationError] = useState('');
  const dateInputRef = useRef(null);

  // Synchronize input text with selectedExpiry prop
  useEffect(() => {
    if (selectedExpiry) {
      setInputText(formatIsoToDdMmYyyy(selectedExpiry));
      setValidationError('');
    }
  }, [selectedExpiry]);

  if (!expiries || expiries.length === 0) {
    return (
      <div className="text-xs text-amber-400 font-mono italic">
        No option expiry data available.
      </div>
    );
  }

  const handleApplyInputDate = (valueToTest) => {
    const raw = valueToTest !== undefined ? valueToTest : inputText;
    if (!raw.trim()) {
      setInputText(formatIsoToDdMmYyyy(selectedExpiry));
      setValidationError('');
      return;
    }

    const isoParsed = parseUserDateToIso(raw);
    if (!isoParsed) {
      setValidationError('Invalid expiry date. Please enter a valid date in DD/MM/YYYY format.');
      return;
    }

    // Check if parsed date exists in provider expiries list
    const isSupported = expiries.some(exp => exp.trim() === isoParsed);
    if (isSupported) {
      setValidationError('');
      setInputText(formatIsoToDdMmYyyy(isoParsed));
      onExpiryChange(isoParsed);
    } else {
      setValidationError('No option chain available for this expiry.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyInputDate();
    }
  };

  const handleCalendarPick = (e) => {
    const pickedIso = e.target.value;
    if (!pickedIso) return;
    setInputText(formatIsoToDdMmYyyy(pickedIso));
    handleApplyInputDate(pickedIso);
  };

  return (
    <div className="space-y-1 font-mono text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-slate-400 flex items-center gap-1 font-semibold uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          Expiry Date:
        </label>

        {/* User-Typable Input Field (DD/MM/YYYY) */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setValidationError('');
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => handleApplyInputDate()}
            placeholder="DD/MM/YYYY"
            className="bg-slate-900 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-xs w-[115px] shadow-sm transition"
          />

          {/* Calendar Picker Trigger */}
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker && dateInputRef.current.showPicker()}
            className="ml-1 p-1.5 rounded bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-700 hover:bg-slate-700 transition"
            title="Open Calendar Picker"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>

          {/* Native HTML5 Hidden Calendar Picker */}
          <input
            ref={dateInputRef}
            type="date"
            onChange={handleCalendarPick}
            value={selectedExpiry || ''}
            className="sr-only"
            tabIndex={-1}
          />
        </div>

        {/* Dropdown Selector for Available Provider Expiries */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500 uppercase">Select:</span>
          <select
            value={selectedExpiry}
            onChange={(e) => {
              const val = e.target.value;
              setValidationError('');
              setInputText(formatIsoToDdMmYyyy(val));
              onExpiryChange(val);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-xs cursor-pointer shadow-sm hover:bg-slate-800 transition max-w-[150px]"
          >
            {expiries.map((exp) => (
              <option key={exp} value={exp} className="bg-slate-900 text-slate-100">
                {formatIsoToDdMmYyyy(exp)} ({exp})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Validation or Availability Error Message */}
      {validationError && (
        <div className="text-[11px] text-rose-400 flex items-center gap-1.5 bg-rose-950/60 border border-rose-500/30 p-1.5 rounded font-mono">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
