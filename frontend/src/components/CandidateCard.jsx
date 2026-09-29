import React, { useState } from 'react';
import { Award, CheckCircle, AlertTriangle, Eye, ShieldCheck, CheckSquare, Square, Star, Briefcase, FileText, MessageSquare, AlertOctagon } from 'lucide-react';

const STAGE_COLORS = {
  Screened: '#6366f1',
  Shortlisted: '#10b981',
  Interviewing: '#06b6d4',
  Offered: '#a855f7',
  Rejected: '#f43f5e'
};

const CandidateCard = ({
  candidate,
  rankIndex,
  onSelectCandidate,
  onOpenSplitViewer,
  blindMode,
  isCompared,
  onToggleCompare,
  knockoutResult,
  onUpdateRating,
  onUpdateStage
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, active: false });

  const score = candidate.score;
  let gaugeClass = 'high';
  if (score < 55) gaugeClass = 'low';
  else if (score < 75) gaugeClass = 'medium';

  const displayName = blindMode
    ? `Candidate #${rankIndex + 1} (Anonymized)`
    : candidate.candidate_name || 'Candidate';

  const initials = blindMode
    ? `C${rankIndex + 1}`
    : candidate.candidate_name
      ? candidate.candidate_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'C';

  const stage = candidate.stage || 'Screened';
  const stageColor = STAGE_COLORS[stage] || '#6366f1';
  const isKnockedOut = knockoutResult?.isKnockedOut;

  // 3D Mouse Parallax Tilt Handlers
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = -((y - centerY) / centerY) * 7;
    const tiltY = ((x - centerX) / centerX) * 7;

    setTilt({
      x: tiltX,
      y: tiltY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
      active: true
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50, active: false });
  };

  return (
    <div
      className={`candidate-card ${rankIndex === 0 ? 'top-rank' : ''} ${isKnockedOut ? 'knocked-out-card' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: tilt.active
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.015, 1.015, 1.015) translateZ(10px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: tilt.active ? 'transform 0.08s ease-out' : 'transform 0.35s ease-out, box-shadow 0.35s ease',
        opacity: isKnockedOut ? 0.75 : 1,
        borderColor: isKnockedOut ? 'rgba(244, 63, 94, 0.4)' : undefined
      }}
    >
      {/* 3D Specular Light Glare Layer */}
      {tilt.active && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: 'inherit',
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      )}

      {/* Top Header Row with Checkbox & Identity */}
      <div className="card-top-row" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Checkbox for side-by-side comparison */}
          <button
            onClick={() => onToggleCompare(candidate.candidate_id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: isCompared ? 'var(--accent-purple)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center'
            }}
            title={isCompared ? "Remove from Compare Matrix" : "Select to Compare Head-to-Head"}
          >
            {isCompared ? <CheckSquare size={20} color="var(--accent-purple)" /> : <Square size={20} />}
          </button>

          <div className="candidate-identity">
            <div className="avatar-badge" style={blindMode ? { background: 'linear-gradient(135deg, #a855f7, #6366f1)' } : {}}>
              {initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 className="cand-name">{displayName}</h3>
                
                {rankIndex === 0 && !isKnockedOut && (
                  <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Award size={12} /> Top Match #1
                  </span>
                )}

                {isKnockedOut ? (
                  <span style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '10px', border: '1px solid rgba(244, 63, 94, 0.4)', display: 'flex', alignItems: 'center', gap: '3px' }} title={knockoutResult?.reason}>
                    <AlertOctagon size={11} /> Knocked Out
                  </span>
                ) : (
                  <span
                    style={{
                      background: `${stageColor}22`,
                      color: stageColor,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.55rem',
                      borderRadius: '10px',
                      border: `1px solid ${stageColor}44`
                    }}
                  >
                    {stage}
                  </span>
                )}

                {/* Interactive Star Rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={12}
                      fill={(candidate.rating || 0) >= star ? '#f59e0b' : 'none'}
                      color={(candidate.rating || 0) >= star ? '#f59e0b' : 'var(--text-dim)'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (onUpdateRating) {
                          const newR = (candidate.rating || 0) === star ? 0 : star;
                          onUpdateRating(candidate.candidate_id, newR);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '3px' }}>
                <p className="cand-meta">
                  {blindMode ? 'Demographics Redacted' : `File: ${candidate.filename}`} • {(candidate.semantic_similarity * 100).toFixed(0)}% sim
                </p>
                {candidate.experience_years > 0 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                    <Briefcase size={11} /> {candidate.experience_years}y exp
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3D Gyroscopic Score Gauge */}
        <div className="score-gauge-container">
          <div className="gyro-orbit-wrapper">
            <div className="gyro-ring ring-1"></div>
            <div className="gyro-ring ring-2"></div>
            <div className={`score-badge-circle ${gaugeClass}`}>
              <span>{score.toFixed(0)}</span>
              <span style={{ fontSize: '0.6rem', opacity: 0.8, marginTop: '-4px' }}>/100</span>
            </div>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px', fontWeight: 600 }}>
            Match Score
          </span>
        </div>
      </div>

      {/* Knockout Reason Alert if knocked out */}
      {isKnockedOut && knockoutResult?.reason && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', padding: '0.35rem 0.65rem', marginTop: '0.65rem', fontSize: '0.72rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '5px', position: 'relative', zIndex: 2 }}>
          <AlertOctagon size={12} />
          <span>Knockout: {knockoutResult.reason}</span>
        </div>
      )}

      {/* Anomaly & Red Flags Badges if present */}
      {candidate.anomalies?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.65rem', position: 'relative', zIndex: 2 }}>
          {candidate.anomalies.map((anom, aIdx) => (
            <span
              key={aIdx}
              style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#f87171',
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title={anom.detail}
            >
              <AlertTriangle size={11} /> {anom.title}
            </span>
          ))}
        </div>
      )}

      {/* Recruiter Notes Indicator if present */}
      {candidate.recruiter_notes && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border-color)', borderRadius: '6px', padding: '0.35rem 0.65rem', marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', zIndex: 2 }}>
          <MessageSquare size={12} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            "{candidate.recruiter_notes}"
          </span>
        </div>
      )}

      {/* Skills Overlap */}
      <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={13} color="#10b981" /> Matched Skills ({candidate.matched_skills.length}):
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            {candidate.skill_match_percentage}% Fit
          </span>
        </div>

        <div className="skills-wrap">
          {candidate.matched_skills.slice(0, 5).map((skill, idx) => (
            <span key={idx} className="skill-tag matched">
              ✓ {skill}
            </span>
          ))}
          {candidate.matched_skills.length > 5 && (
            <span className="skill-tag neutral">
              +{candidate.matched_skills.length - 5} more
            </span>
          )}
          {candidate.matched_skills.length === 0 && (
            <span className="skill-tag missing">No exact keyword match</span>
          )}
        </div>
      </div>

      {/* Action Footer with Split Document Viewer & Full Dossier */}
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2, flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          onClick={() => onOpenSplitViewer && onOpenSplitViewer(candidate)}
          className="btn-secondary"
          style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          title="Open interactive side-by-side resume text with skill highlighting"
        >
          <FileText size={13} color="var(--accent-cyan)" />
          <span>Split Viewer</span>
        </button>

        <button
          className="btn-secondary"
          onClick={() => onSelectCandidate(candidate)}
          style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))', borderColor: 'rgba(99, 102, 241, 0.4)', color: 'var(--text-main)', fontWeight: 700, padding: '0.3rem 0.75rem', fontSize: '0.74rem' }}
        >
          <Eye size={13} color="#6366f1" />
          <span>Full Dossier & Qs</span>
        </button>
      </div>
    </div>
  );
};

export default CandidateCard;
