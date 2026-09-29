import React, { useState, useMemo } from 'react';
import { X, Search, CheckCircle, AlertTriangle, ShieldCheck, Copy, Check, Filter } from 'lucide-react';

const ResumeSplitViewer = ({ candidate, jdSkills = [], onClose, blindMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightMatched, setHighlightMatched] = useState(true);
  const [highlightMissing, setHighlightMissing] = useState(true);
  const [highlightMetrics, setHighlightMetrics] = useState(true);
  const [copied, setCopied] = useState(false);

  const rawText = candidate.raw_text || candidate.sanitized_preview || "No resume text content available.";
  const matchedSkills = candidate.matched_skills || [];
  const missingSkills = candidate.missing_skills || [];
  const anomalies = candidate.anomalies || [];

  const displayName = blindMode
    ? `Candidate #${candidate.display_rank || 1} (Blind)`
    : candidate.candidate_name || 'Candidate';

  // Build regex highlighter over raw text
  const highlightedContent = useMemo(() => {
    if (!rawText) return null;

    // Split text into lines/paragraphs
    const lines = rawText.split('\n');

    return lines.map((line, lineIdx) => {
      if (!line.trim()) {
        return <div key={lineIdx} style={{ height: '0.75rem' }} />;
      }

      // Check if line contains matches
      let segments = [{ text: line, type: 'normal' }];

      // Highlight Matched Skills (Emerald)
      if (highlightMatched && matchedSkills.length > 0) {
        matchedSkills.forEach(skill => {
          if (!skill || skill.length < 2) return;
          const newSegments = [];
          const regex = new RegExp(`\\b(${escapeRegex(skill)})\\b`, 'gi');

          segments.forEach(seg => {
            if (seg.type !== 'normal') {
              newSegments.push(seg);
              return;
            }
            const parts = seg.text.split(regex);
            for (let i = 0; i < parts.length; i++) {
              if (parts[i].toLowerCase() === skill.toLowerCase()) {
                newSegments.push({ text: parts[i], type: 'matched', label: skill });
              } else if (parts[i]) {
                newSegments.push({ text: parts[i], type: 'normal' });
              }
            }
          });
          segments = newSegments;
        });
      }

      // Highlight Metrics/Numbers (Cyan)
      if (highlightMetrics) {
        const metricRegex = /(\b\d+[\d,.]*(?:\+|%|\s*(?:years?|yrs?|k|m|users?|requests?|growth|team))\b)/gi;
        const newSegments = [];
        segments.forEach(seg => {
          if (seg.type !== 'normal') {
            newSegments.push(seg);
            return;
          }
          const parts = seg.text.split(metricRegex);
          for (let i = 0; i < parts.length; i++) {
            if (metricRegex.test(parts[i])) {
              newSegments.push({ text: parts[i], type: 'metric' });
            } else if (parts[i]) {
              newSegments.push({ text: parts[i], type: 'normal' });
            }
          }
        });
        segments = newSegments;
      }

      // Filter by custom search term (Yellow)
      if (searchTerm.trim().length >= 2) {
        const sRegex = new RegExp(`(${escapeRegex(searchTerm.trim())})`, 'gi');
        const newSegments = [];
        segments.forEach(seg => {
          if (seg.type === 'search') {
            newSegments.push(seg);
            return;
          }
          const parts = seg.text.split(sRegex);
          for (let i = 0; i < parts.length; i++) {
            if (parts[i].toLowerCase() === searchTerm.trim().toLowerCase()) {
              newSegments.push({ text: parts[i], type: 'search' });
            } else if (parts[i]) {
              newSegments.push({ ...seg, text: parts[i] });
            }
          }
        });
        segments = newSegments;
      }

      return (
        <div key={lineIdx} style={{ lineHeight: '1.65', marginBottom: '3px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
          {segments.map((seg, sIdx) => {
            if (seg.type === 'matched') {
              return (
                <mark
                  key={sIdx}
                  title={`Matched JD Skill: ${seg.label}`}
                  style={{
                    background: 'rgba(16, 185, 129, 0.28)',
                    color: '#34d399',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    fontWeight: 700,
                    cursor: 'help'
                  }}
                >
                  ✓ {seg.text}
                </mark>
              );
            }
            if (seg.type === 'metric') {
              return (
                <mark
                  key={sIdx}
                  style={{
                    background: 'rgba(6, 182, 212, 0.2)',
                    color: '#22d3ee',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontWeight: 600
                  }}
                >
                  {seg.text}
                </mark>
              );
            }
            if (seg.type === 'search') {
              return (
                <mark
                  key={sIdx}
                  style={{
                    background: '#fef08a',
                    color: '#854d0e',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontWeight: 700
                  }}
                >
                  {seg.text}
                </mark>
              );
            }
            return <span key={sIdx}>{seg.text}</span>;
          })}
        </div>
      );
    });
  }, [rawText, matchedSkills, highlightMatched, highlightMetrics, searchTerm]);

  function escapeRegex(string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1150px', width: '95%', height: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Top Header */}
        <div className="modal-header" style={{ paddingBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Interactive Document Viewer: {displayName}
              </h2>
              <span className="skill-tag matched" style={{ fontSize: '0.8rem', padding: '0.2rem 0.65rem' }}>
                Match Score: {candidate.score}/100
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              Side-by-side smart document viewer with direct keyword highlight mapping & anomaly inspection
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleCopy}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              onClick={onClose}
              style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--border-color)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '0.75rem 1.25rem',
            background: 'var(--bg-dark)',
            borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap'
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Filter keyword in document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.4rem 0.65rem 0.4rem 2rem',
                fontSize: '0.82rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-main)'
              }}
            />
          </div>

          {/* Highlight Filter Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: '#34d399', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={highlightMatched}
                onChange={(e) => setHighlightMatched(e.target.checked)}
              />
              <span>Matched Skills ({matchedSkills.length})</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: '#22d3ee', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={highlightMetrics}
                onChange={(e) => setHighlightMetrics(e.target.checked)}
              />
              <span>Metrics & Tenures</span>
            </label>
          </div>
        </div>

        {/* Split Screen Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', flex: 1, overflow: 'hidden', padding: '1rem' }}>
          
          {/* Left Pane: Highlighted Resume Document */}
          <div
            style={{
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono, monospace)',
              whiteSpace: 'pre-wrap',
              height: '100%'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                📄 Candidate Raw Document Stream
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                {blindMode ? 'EEOC Sanitized' : candidate.filename}
              </span>
            </div>
            {highlightedContent}
          </div>

          {/* Right Pane: AI Analysis & Extraction Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', height: '100%' }}>
            
            {/* Matched Skills Box */}
            <div style={{ background: 'var(--bg-dark)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <h4 style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={15} /> Identified Required Skills ({matchedSkills.length})
              </h4>
              <div className="skills-wrap" style={{ gap: '0.35rem' }}>
                {matchedSkills.map((s, idx) => (
                  <span key={idx} className="skill-tag matched" style={{ fontSize: '0.78rem' }}>
                    ✓ {s}
                  </span>
                ))}
                {matchedSkills.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No direct matches</span>}
              </div>
            </div>

            {/* Missing Skills Box */}
            <div style={{ background: 'var(--bg-dark)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <h4 style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} /> Missing Required Skills ({missingSkills.length})
              </h4>
              <div className="skills-wrap" style={{ gap: '0.35rem' }}>
                {missingSkills.map((s, idx) => (
                  <span key={idx} className="skill-tag missing" style={{ fontSize: '0.78rem' }}>
                    ✗ {s}
                  </span>
                ))}
                {missingSkills.length === 0 && <span style={{ fontSize: '0.8rem', color: '#34d399' }}>100% skill coverage!</span>}
              </div>
            </div>

            {/* Anomaly & Integrity Card */}
            <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <ShieldCheck size={15} color={candidate.integrity_score >= 80 ? '#10b981' : '#f59e0b'} />
                  Document Integrity Check
                </h4>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: candidate.integrity_score >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: candidate.integrity_score >= 80 ? '#10b981' : '#f59e0b'
                  }}
                >
                  {candidate.integrity_score || 100}% Integrity
                </span>
              </div>

              {anomalies.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {anomalies.map((anom, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(244, 63, 94, 0.08)',
                        border: '1px solid rgba(244, 63, 94, 0.25)',
                        borderRadius: '6px',
                        padding: '0.6rem 0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.8rem', fontWeight: 700 }}>
                        <AlertTriangle size={13} />
                        <span>{anom.title}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                        {anom.detail}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: '#10b981', margin: '0.5rem 0 0 0' }}>
                  ✓ No employment timeline gaps or keyword stuffing detected.
                </p>
              )}
            </div>

            {/* Extracted Extraneous Skills */}
            {candidate.extracted_skills?.length > 0 && (
              <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Additional Extracted Skills ({candidate.extracted_skills.length})
                </h4>
                <div className="skills-wrap" style={{ gap: '0.3rem' }}>
                  {candidate.extracted_skills.slice(0, 10).map((s, idx) => (
                    <span key={idx} className="skill-tag neutral" style={{ fontSize: '0.72rem' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeSplitViewer;
