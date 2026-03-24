import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header
      style={{ background: '#000000', borderBottom: '1px solid #1c1c1c' }}
      className="sticky top-0 z-50 w-full px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo — clean SVG icon, clickable to home */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors" style={{ background: '#0a1a1a', border: '1px solid #0e3333' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#06b6d4'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#0e3333'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="#06b6d4" strokeWidth="2"/>
              <path d="M9 12h6M9 16h4" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="font-display font-black text-lg tracking-tight leading-none" style={{ color: '#ffffff' }}>
              AuditGPT
            </div>
            <div className="text-[10px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: '#4b5563' }}>
              Financial Forensics
            </div>
          </div>
        </Link>

        {/* Right chips */}
        <div className="flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: '#0a1a1a', border: '1px solid #0e3333', color: '#06b6d4' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }}></span>
            Kimi K2 · Live
          </div>
          <div
            className="hidden sm:flex items-center px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', color: '#6b7280' }}
          >
            88 companies · 10YR
          </div>
        </div>
      </div>
    </header>
  );
}
