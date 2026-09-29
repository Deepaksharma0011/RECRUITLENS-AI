import React from 'react';
import { Star, Eye, ArrowRight, ArrowLeft, MessageSquare, AlertTriangle, ShieldCheck, CheckCircle, FileText } from 'lucide-react';

const KANBAN_STAGES = [
  { id: 'Screened', label: 'Screened', icon: '📥', color: '#6366f1' },
  { id: 'Shortlisted', label: 'Shortlisted', icon: '🎯', color: '#10b981' },
  { id: 'Interviewing', label: 'Interviewing', icon: '💬', color: '#06b6d4' },
  { id: 'Offered', label: 'Offered', icon: '🌟', color: '#a855f7' },
  { id: 'Rejected', label: 'Archived', icon: '📁', color: '#f43f5e' }
];

const KanbanBoard = ({
  candidates,
  blindMode,
  onSelectCandidate,
  onOpenSplitViewer,
  onUpdateCandidateStage,
  onUpdateCandidateRating
}) => {

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('text/plain');
    if (candidateId && onUpdateCandidateStage) {
      onUpdateCandidateStage(candidateId, targetStage);
    }
  };

  const handleDragStart = (e, candidateId) => {
    e.dataTransfer.setData('text/plain', candidateId);
  };

  return (
    <div
      style={{
        width: '100%',
        minWidth: 0,
        overflowX: 'auto',
        paddingBottom: '1rem',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--primary) var(--bg-dark)'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(200px, 1fr))',
          gap: '0.85rem',
          minHeight: '580px',
          minWidth: '1020px'
        }}
      >
        {KANBAN_STAGES.map((col) => {
          const colCandidates = candidates.filter(c => (c.stage || 'Screened') === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{
                background: 'var(--bg-dark)',
                border: `1px solid var(--border-color)`,
                borderTop: `3px solid ${col.color}`,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                minWidth: '200px',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '0.75rem 0.85rem',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1rem' }}>{col.icon}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {col.label}
                  </span>
                </div>
                <span
                  style={{
                    background: `${col.color}25`,
                    color: col.color,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: '10px'
                  }}
                >
                  {colCandidates.length}
                </span>
              </div>

              {/* Candidates Card Container */}
              <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
                {colCandidates.map((c, idx) => {
                  const displayName = blindMode
                    ? `Candidate #${c.display_rank || idx + 1}`
                    : c.candidate_name || 'Candidate';

                  return (
                    <div
                      key={c.candidate_id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.candidate_id)}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem',
                        boxShadow: 'var(--shadow-sm)',
                        cursor: 'grab',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                      }}
                    >
                      {/* Top Row: Name & Score */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <div>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                            {displayName}
                          </h4>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {(c.semantic_similarity * 100).toFixed(0)}% sim
                          </span>
                        </div>
                        <div
                          style={{
                            background: c.score >= 75 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                            color: c.score >= 75 ? '#10b981' : 'var(--primary)',
                            border: `1px solid ${c.score >= 75 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '8px'
                          }}
                        >
                          {c.score.toFixed(0)}/100
                        </div>
                      </div>

                      {/* Star Rating */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', margin: '0.35rem 0' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            fill={(c.rating || 0) >= star ? '#f59e0b' : 'none'}
                            color={(c.rating || 0) >= star ? '#f59e0b' : 'var(--text-dim)'}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              if (onUpdateCandidateRating) {
                                const newRating = (c.rating || 0) === star ? 0 : star;
                                onUpdateCandidateRating(c.candidate_id, newRating);
                              }
                            }}
                          />
                        ))}
                      </div>

                      {/* Skills pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', margin: '0.5rem 0' }}>
                        {(c.matched_skills || []).slice(0, 3).map((s, sIdx) => (
                          <span key={sIdx} className="skill-tag matched" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                            ✓ {s}
                          </span>
                        ))}
                        {(c.matched_skills || []).length > 3 && (
                          <span className="skill-tag neutral" style={{ fontSize: '0.68rem', padding: '1px 4px' }}>
                            +{c.matched_skills.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Anomaly Badge if any */}
                      {c.anomalies?.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171', fontSize: '0.68rem', fontWeight: 600, marginTop: '4px' }}>
                          <AlertTriangle size={11} /> {c.anomalies.length} Anomaly note
                        </div>
                      )}

                      {/* Stage Switcher Controls & Dossier View */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', gap: '4px' }}>
                        <select
                          value={c.stage || 'Screened'}
                          onChange={(e) => {
                            if (onUpdateCandidateStage) {
                              onUpdateCandidateStage(c.candidate_id, e.target.value);
                            }
                          }}
                          style={{
                            fontSize: '0.7rem',
                            background: 'var(--bg-dark)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            padding: '2px 4px',
                            flex: 1
                          }}
                        >
                          {KANBAN_STAGES.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>

                        <div style={{ display: 'flex', gap: '3px' }}>
                          {onOpenSplitViewer && (
                            <button
                              onClick={() => onOpenSplitViewer(c)}
                              className="btn-secondary"
                              style={{ padding: '2px 5px', fontSize: '0.7rem', borderRadius: '4px' }}
                              title="Open Split Document Viewer"
                            >
                              <FileText size={11} color="var(--accent-cyan)" />
                            </button>
                          )}
                          <button
                            onClick={() => onSelectCandidate(c)}
                            className="btn-secondary"
                            style={{ padding: '2px 5px', fontSize: '0.7rem', borderRadius: '4px' }}
                            title="Open Full Candidate Dossier"
                          >
                            <Eye size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colCandidates.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2.5rem 0.5rem', color: 'var(--text-dim)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                    Drag candidate here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
