import { useState, useEffect, useRef } from 'react';
import { searchCompanies } from '../../services/api';

const QUICK_LINKS = [
  { label: 'Satyam', query: 'Satyam Computer' },
  { label: 'TCS', query: 'TCS.NS' },
  { label: 'Reliance', query: 'RELIANCE.NS' },
  { label: 'Yes Bank', query: 'YESBANK.NS' },
  { label: 'HDFC Bank', query: 'HDFCBANK.NS' },
  { label: 'Infosys', query: 'INFY.NS' },
];

export default function InputForm({ onSubmit }) {
  const [inputVal, setInputVal] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
        setActiveSuggestion(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (value) => {
    setInputVal(value);
    setActiveSuggestion(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchCompanies(value.trim());
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch { /* silence */ }
      finally { setLoading(false); }
    }, 300);
  };

  const handleSelect = (suggestion) => {
    setInputVal(suggestion.name);
    setSuggestions([]);
    setShowDropdown(false);
    onSubmit(suggestion.symbol);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      onSubmit(inputVal.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeSuggestion]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveSuggestion(-1);
    }
  };

  return (
    <div className="w-full" ref={wrapperRef}>
      {/* Search bar */}
      <div className="relative">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center rounded-xl overflow-hidden" style={{ background: '#111111', border: '1px solid #222222' }}>
            {/* Icon */}
            <div className="pl-5 pr-3 flex-shrink-0" style={{ color: loading ? '#06b6d4' : '#6b7280' }}>
              {loading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>

            {/* Input */}
            <input
              type="text"
              value={inputVal}
              onChange={(e) => handleInput(e.target.value)}
              onFocus={() => { if (suggestions.length) setShowDropdown(true); }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              autoFocus
              placeholder="Enter company name or NSE ticker..."
              style={{
                flex: 1,
                background: '#111111',
                border: 'none',
                outline: 'none',
                color: '#f9fafb',
                caretColor: '#06b6d4',
                padding: '18px 12px',
                fontSize: '1rem',
              }}
              className="placeholder-gray-500"
            />

            {/* Button */}
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="flex items-center justify-center font-black tracking-widest text-xs uppercase transition-colors duration-200"
              style={{
                width: '140px',
                background: inputVal.trim() ? '#06b6d4' : '#161616',
                color: inputVal.trim() ? '#000000' : '#4b5563',
                border: 'none',
                borderLeft: '1px solid #222222',
                cursor: inputVal.trim() ? 'pointer' : 'not-allowed',
                flexShrink: 0,
                alignSelf: 'stretch',
              }}
              onMouseEnter={(e) => { if (inputVal.trim()) e.currentTarget.style.background = '#22d3ee'; }}
              onMouseLeave={(e) => { if (inputVal.trim()) e.currentTarget.style.background = '#06b6d4'; }}
            >
              Analyze
            </button>
          </div>
        </form>

        {/* Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
            style={{ background: '#111111', border: '1px solid #222222' }}
          >
            {suggestions.map((s, i) => (
              <button
                key={s.symbol}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
                style={{
                  background: i === activeSuggestion ? '#1a1a1a' : 'transparent',
                  borderBottom: i < suggestions.length - 1 ? '1px solid #1a1a1a' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#161616'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = i === activeSuggestion ? '#1a1a1a' : 'transparent'; }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background: '#1a2a2a', color: '#06b6d4' }}>
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: '#e2e8f0' }}>{s.name}</div>
                  <div className="text-xs mt-0.5 font-mono" style={{ color: '#4b5563' }}>{s.symbol} · {s.exchange}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded"
                  style={{ background: '#1a1a1a', color: '#374151' }}>
                  NSE
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] mr-1" style={{ color: '#4b5563' }}>Try:</span>
        {QUICK_LINKS.map(c => (
          <button
            key={c.label}
            type="button"
            className="px-4 py-1.5 rounded-full transition-all duration-200"
            onClick={() => {
              setInputVal(c.label);
              setSuggestions([]);
              setShowDropdown(false);
              onSubmit(c.query);
            }}
            style={{ 
              background: '#0a0a0a', 
              border: '1px solid #1c1c1c',
              color: '#6b7280',
              cursor: 'pointer' 
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#111111'; e.currentTarget.style.color = '#06b6d4'; e.currentTarget.style.borderColor = '#06b6d4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#0a0a0a'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#1c1c1c'; }}
          >
            <span className="text-[11px] font-bold tracking-wide">
              {c.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
