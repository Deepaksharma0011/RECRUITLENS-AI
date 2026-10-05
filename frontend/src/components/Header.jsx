import React from 'react';
import { Target, RefreshCw, ShieldCheck, Eye, EyeOff, FileText, Download, Sun, Moon, Award } from 'lucide-react';

const Header = ({
  onReset,
  backendConnected,
  blindMode,
  setBlindMode,
  hasCandidates,
  onExportCSV,
  onPrintPDF,
  onOpenEEOCAudit,
  theme = 'light',
  setTheme
}) => {
  const toggleTheme = () => {
    if (setTheme) {
      setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    }
  };

  return (
    <header className="app-header">
      <div
        className="logo-area"
        onClick={() => window.location.reload()}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        title="Click to refresh page"
      >
        <div className="logo-icon-bg">
          <Target size={24} color="#ffffff" />
        </div>
        <div>
          <h1 className="brand-title">RecruitLens AI</h1>
          <span className="brand-tag">Enterprise Demographic-Unbiased Resume Screener & ATS</span>
        </div>
      </div>

      <div className="header-status-pills">
        {/* Theme Toggle (Light / Dark Mode) */}
        {setTheme && (
          <button
            onClick={toggleTheme}
            className="btn-secondary theme-toggle-btn"
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.78rem',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700
            }}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6366f1" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        )}

        {/* Blind Hiring Anonymization Mode Toggle */}
        <button
          onClick={() => setBlindMode(!blindMode)}
          style={{
            background: blindMode ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${blindMode ? 'rgba(168, 85, 247, 0.4)' : 'var(--border-color)'}`,
            color: blindMode ? '#c084fc' : 'var(--text-muted)',
            padding: '0.4rem 0.85rem',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title={blindMode ? "Blind Hiring Protection Active (Names & Contact Redacted)" : "Click to Enable Blind Hiring Mode"}
        >
          {blindMode ? <EyeOff size={15} color="#c084fc" /> : <Eye size={15} />}
          <span>{blindMode ? 'Blind Hiring: ON' : 'Blind Hiring: OFF'}</span>
        </button>

        {/* EEOC Audit Certificate Button */}
        <button
          className="btn-secondary"
          onClick={onOpenEEOCAudit}
          style={{
            fontSize: '0.78rem',
            padding: '0.4rem 0.75rem',
            background: 'rgba(16, 185, 129, 0.12)',
            borderColor: 'rgba(16, 185, 129, 0.35)',
            color: '#34d399',
            fontWeight: 700,
            borderRadius: '20px'
          }}
          title="Open EEOC / Fair-Hiring Compliance Certificate"
        >
          <Award size={14} color="#10b981" />
          <span>EEOC Certificate</span>
        </button>

        {/* Report Exports */}
        {hasCandidates && (
          <>
            <button
              className="btn-secondary"
              onClick={onExportCSV}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
              title="Download Candidates CSV Scorecard"
            >
              <Download size={14} color="var(--accent-cyan)" />
              <span>CSV Export</span>
            </button>
            <button
              className="btn-secondary"
              onClick={onPrintPDF}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
              title="Print Executive PDF Summary Report"
            >
              <FileText size={14} color="var(--accent-emerald)" />
              <span>PDF Dossier</span>
            </button>
          </>
        )}

        {/* Reset Session */}
        <button
          className="btn-secondary"
          onClick={onReset}
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
          title="Reset current session and clear uploaded files"
        >
          <RefreshCw size={14} />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
