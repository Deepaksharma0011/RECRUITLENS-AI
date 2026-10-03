import React from 'react';
import { X, Check, AlertCircle, Award, ShieldCheck, Zap } from 'lucide-react';

const CandidateCompareModal = ({ candidates, onClose, blindMode }) => {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '950px', width: '92%' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Head-to-Head Candidate Evaluation
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
              Candidate Comparison Matrix ({candidates.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Matrix Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${candidates.length}, 1fr)`, gap: '1rem', overflowX: 'auto' }}>
          
          {/* Row Labels Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>Composite Match</div>
            <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>Semantic Similarity</div>
            <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>Skill Coverage %</div>
            <div style={{ minHeight: '60px' }}>Matched Skills</div>
            <div style={{ minHeight: '60px' }}>Missing Skills</div>
            <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>Bias Audit Shield</div>
          </div>

          {/* Candidate Columns */}
          {candidates.map((cand, idx) => {
            const displayName = blindMode ? `Candidate #${cand.display_rank || idx + 1}` : cand.candidate_name;

            return (
              <div key={cand.candidate_id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                
                {/* Column Candidate Card Header */}
                <div style={{ height: '3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>RANK #{idx + 1}</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0 0 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </h3>
                </div>

                {/* Score */}
                <div style={{ height: '40px', display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: cand.score >= 75 ? '#10b981' : cand.score >= 50 ? '#6366f1' : '#f59e0b' }}>
                    {cand.score}/100
                  </span>
                </div>

                {/* Semantic Sim */}
                <div style={{ height: '40px', display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#fff', marginBottom: '3px' }}>
                      <span>NLP Relevance</span>
                      <span>{(cand.semantic_similarity * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${cand.semantic_similarity * 100}%`, background: 'var(--accent-purple)' }}></div>
                    </div>
                  </div>
                </div>

                {/* Skill Match % */}
                <div style={{ height: '40px', display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#fff', marginBottom: '3px' }}>
                      <span>Skill Overlap</span>
                      <span>{cand.skill_match_percentage}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${cand.skill_match_percentage}%`, background: 'var(--accent-cyan)' }}></div>
                    </div>
                  </div>
                </div>

                {/* Matched Skills */}
                <div style={{ minHeight: '60px', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {cand.matched_skills && cand.matched_skills.length > 0 ? (
                      cand.matched_skills.map((s, i) => (
                        <span key={i} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600 }}>
                          ✓ {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>None matched</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div style={{ minHeight: '60px', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {cand.missing_skills && cand.missing_skills.length > 0 ? (
                      cand.missing_skills.map((s, i) => (
                        <span key={i} style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#f87171', border: '1px solid rgba(244, 63, 94, 0.25)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600 }}>
                          ✗ {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Zero skill gaps!</span>
                    )}
                  </div>
                </div>

                {/* Bias Shield */}
                <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
                    <ShieldCheck size={16} />
                    <span>Demographics Masked</span>
                  </div>
                </div>

              </div>
            );
          })}

        </div>

      </div>
    </div>
  );
};

export default CandidateCompareModal;
