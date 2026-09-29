import React, { useState, useMemo } from 'react';
import CandidateCard from './CandidateCard';
import KanbanBoard from './KanbanBoard';
import {
  Users, Search, SlidersHorizontal, Sparkles, Layers,
  Filter, LayoutGrid, Table, Kanban, AlertOctagon, Star, Eye, FileText,
  Maximize2, Minimize2
} from 'lucide-react';

const STAGE_FILTERS = [
  { id: 'all', label: 'All Stages' },
  { id: 'Screened', label: 'Screened' },
  { id: 'Shortlisted', label: 'Shortlisted' },
  { id: 'Interviewing', label: 'Interviewing' },
  { id: 'Offered', label: 'Offered' },
  { id: 'Rejected', label: 'Archived' }
];

const CandidateList = ({
  candidates,
  jobTitle,
  onSelectCandidate,
  onOpenSplitViewer,
  isLoading,
  blindMode,
  selectedCompareIds,
  onToggleCompare,
  onOpenCompare,
  onOpenKnockoutModal,
  knockoutConfig,
  onUpdateCandidateStage,
  onUpdateCandidateRating,
  isFullWidth,
  onToggleFullWidth
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'experience' | 'name'
  const [stageFilter, setStageFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'kanban'

  // Calculate Knockout Results for Candidates
  const knockoutResultsMap = useMemo(() => {
    const map = {};
    if (!knockoutConfig || !knockoutConfig.active) {
      return map;
    }

    candidates.forEach(c => {
      let isKnockedOut = false;
      let reason = '';

      // Check min exp
      if (knockoutConfig.minExp > 0 && (c.experience_years || 0) < knockoutConfig.minExp) {
        isKnockedOut = true;
        reason = `Exp ${c.experience_years || 0}y < ${knockoutConfig.minExp}y required`;
      }

      // Check min score
      if (!isKnockedOut && knockoutConfig.minScore > 0 && c.score < knockoutConfig.minScore) {
        isKnockedOut = true;
        reason = `Score ${c.score} < ${knockoutConfig.minScore}% cutoff`;
      }

      // Check mandatory skills
      if (!isKnockedOut && knockoutConfig.mandatorySkills?.length > 0) {
        const candidateSkillsLower = (c.extracted_skills || c.matched_skills || []).map(s => s.toLowerCase());
        const missingMandatory = knockoutConfig.mandatorySkills.filter(
          mSkill => !candidateSkillsLower.some(cs => cs.includes(mSkill.toLowerCase()) || mSkill.toLowerCase().includes(cs))
        );
        if (missingMandatory.length > 0) {
          isKnockedOut = true;
          reason = `Missing mandatory: ${missingMandatory.join(', ')}`;
        }
      }

      map[c.candidate_id] = { isKnockedOut, reason };
    });

    return map;
  }, [candidates, knockoutConfig]);

  // Filtered list
  const filteredCandidates = candidates
    .filter(c => {
      // Knockout hide rule
      if (knockoutConfig?.hideKnockedOut && knockoutResultsMap[c.candidate_id]?.isKnockedOut) {
        return false;
      }

      const displayName = blindMode ? `Candidate` : (c.candidate_name || '');
      const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.matched_skills || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.extracted_skills || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStage = stageFilter === 'all' || (c.stage || 'Screened') === stageFilter;
      return matchesSearch && matchesStage;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'experience') return (b.experience_years || 0) - (a.experience_years || 0);
      if (sortBy === 'name') {
        const nameA = blindMode ? `Candidate` : (a.candidate_name || '');
        const nameB = blindMode ? `Candidate` : (b.candidate_name || '');
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

  const knockedOutCount = Object.values(knockoutResultsMap).filter(k => k.isKnockedOut).length;

  return (
    <div
      className="panel-card"
      style={{
        height: '100%',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minWidth: 0
      }}
    >
      {/* Header Row */}
      <div className="section-title-row" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 className="section-title">
          <Users size={20} color="#10b981" />
          <span>Talent Pipeline & ATS</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            ({candidates.length})
          </span>
        </h2>

        {/* View Switchers & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          
          {/* View Mode Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-dark)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
              title="Card Grid View"
            >
              <LayoutGrid size={13} />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
              title="Table Matrix View"
            >
              <Table size={13} />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                background: viewMode === 'kanban' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'kanban' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
              title="Kanban ATS Board View"
            >
              <Kanban size={13} />
              <span>Kanban</span>
            </button>
          </div>

          {/* Full Width ATS Expand/Collapse Button */}
          {onToggleFullWidth && (
            <button
              onClick={onToggleFullWidth}
              className="btn-secondary"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={isFullWidth ? "Collapse ATS back to 2-column layout" : "Expand ATS to full screen width"}
            >
              {isFullWidth ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span>{isFullWidth ? 'Standard View' : 'Full Width ATS'}</span>
            </button>
          )}

          {/* Hard Filters & Knockout Wizard Trigger */}
          <button
            onClick={onOpenKnockoutModal}
            className="btn-secondary"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              borderRadius: '20px',
              border: knockoutConfig?.active ? '1px solid #f43f5e' : '1px solid var(--border-color)',
              color: knockoutConfig?.active ? '#f43f5e' : 'var(--text-main)',
              background: knockoutConfig?.active ? 'rgba(244, 63, 94, 0.15)' : undefined
            }}
          >
            <AlertOctagon size={13} color={knockoutConfig?.active ? '#f43f5e' : 'var(--accent-purple)'} />
            <span>Knockout {knockedOutCount > 0 ? `(${knockedOutCount})` : ''}</span>
          </button>

          {/* Compare Button */}
          {selectedCompareIds?.length > 0 && (
            <button
              onClick={onOpenCompare}
              className="btn-primary"
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.75rem',
                background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))',
                borderRadius: '20px'
              }}
            >
              <Layers size={13} />
              <span>Compare ({selectedCompareIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Stage Filter Chips (Visible in Grid/Table mode) */}
      {candidates.length > 0 && viewMode !== 'kanban' && (
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem', overflowX: 'auto', paddingBottom: '2px' }}>
          {STAGE_FILTERS.map(f => {
            const count = f.id === 'all'
              ? candidates.length
              : candidates.filter(c => (c.stage || 'Screened') === f.id).length;

            return (
              <button
                key={f.id}
                onClick={() => setStageFilter(f.id)}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: stageFilter === f.id ? 'var(--primary)' : 'var(--bg-dark)',
                  color: stageFilter === f.id ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${stageFilter === f.id ? 'var(--primary)' : 'var(--border-color)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{f.label}</span>
                <span style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '10px', fontSize: '0.65rem' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Controls Bar: Search & Sort */}
      {candidates.length > 0 && viewMode !== 'kanban' && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search candidate name or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2rem',
                background: 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.8rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'var(--bg-dark)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.45rem 0.75rem',
                fontSize: '0.78rem'
              }}
            >
              <option value="score">Highest Match Score</option>
              <option value="experience">Years of Experience</option>
              <option value="name">Candidate Name</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem auto' }}></div>
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Screening & Ranking Candidates...</h3>
          <p style={{ fontSize: '0.85rem' }}>Extracting features, scrubbing bias, and computing MiniLM semantic embeddings.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && candidates.length === 0 && (
        <div className="empty-state-wrap">
          <div className="empty-state-icon">
            <Users size={32} color="var(--accent-purple)" />
          </div>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 700 }}>
            No Candidates Evaluated Yet
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 1.5rem auto', lineHeight: '1.5' }}>
            Upload resume files or click <strong>"Load 3 Sample Resumes"</strong> to see AI scoring, rubrics, and the ATS Kanban board in action.
          </p>
        </div>
      )}

      {/* VIEW 1: KANBAN ATS BOARD */}
      {!isLoading && candidates.length > 0 && viewMode === 'kanban' && (
        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0, width: '100%' }}>
          <KanbanBoard
            candidates={filteredCandidates}
            blindMode={blindMode}
            onSelectCandidate={onSelectCandidate}
            onOpenSplitViewer={onOpenSplitViewer}
            onUpdateCandidateStage={onUpdateCandidateStage}
            onUpdateCandidateRating={onUpdateCandidateRating}
          />
        </div>
      )}

      {/* VIEW 2: TABLE MATRIX VIEW */}
      {!isLoading && candidates.length > 0 && viewMode === 'table' && (
        <div style={{ overflowX: 'auto', flex: 1, minWidth: 0, width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-dark)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Rank</th>
                <th style={{ padding: '0.75rem' }}>Candidate</th>
                <th style={{ padding: '0.75rem' }}>Stage</th>
                <th style={{ padding: '0.75rem' }}>Score</th>
                <th style={{ padding: '0.75rem' }}>Similarity</th>
                <th style={{ padding: '0.75rem' }}>Matched Skills</th>
                <th style={{ padding: '0.75rem' }}>Rating</th>
                <th style={{ padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((c, idx) => {
                const displayName = blindMode ? `Candidate #${idx + 1}` : c.candidate_name || 'Candidate';
                const ko = knockoutResultsMap[c.candidate_id];

                return (
                  <tr key={c.candidate_id} style={{ borderBottom: '1px solid var(--border-color)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>#{idx + 1}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{displayName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.experience_years || 0}y experience</div>
                      {ko?.isKnockedOut && (
                        <span style={{ color: '#f87171', fontSize: '0.68rem', fontWeight: 600 }}>⛔ {ko.reason}</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600 }}>
                        {c.stage || 'Screened'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 800, color: c.score >= 75 ? '#10b981' : 'var(--primary)' }}>
                      {c.score.toFixed(0)}/100
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                      {(c.semantic_similarity * 100).toFixed(0)}%
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', maxWidth: '240px' }}>
                        {(c.matched_skills || []).slice(0, 3).map((s, sIdx) => (
                          <span key={sIdx} className="skill-tag matched" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>✓ {s}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '1px' }}>
                        {[1, 2, 3, 4, 5].map((st) => (
                          <Star key={st} size={11} fill={(c.rating || 0) >= st ? '#f59e0b' : 'none'} color={(c.rating || 0) >= st ? '#f59e0b' : 'var(--text-dim)'} />
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => onOpenSplitViewer && onOpenSplitViewer(c)}
                          className="btn-secondary"
                          style={{ padding: '3px 7px', fontSize: '0.72rem' }}
                          title="Open Split Document Viewer"
                        >
                          <FileText size={12} color="var(--accent-cyan)" />
                        </button>
                        <button
                          onClick={() => onSelectCandidate(c)}
                          className="btn-secondary"
                          style={{ padding: '3px 7px', fontSize: '0.72rem' }}
                          title="Open Full Dossier"
                        >
                          <Eye size={12} color="#6366f1" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 3: CARD GRID VIEW */}
      {!isLoading && candidates.length > 0 && viewMode === 'grid' && (
        <div className="candidate-grid" style={{ flex: 1, overflowY: 'auto', minWidth: 0, width: '100%' }}>
          {filteredCandidates.map((cand, idx) => (
            <CandidateCard
              key={cand.candidate_id}
              candidate={cand}
              rankIndex={idx}
              onSelectCandidate={onSelectCandidate}
              onOpenSplitViewer={onOpenSplitViewer}
              blindMode={blindMode}
              isCompared={selectedCompareIds?.includes(cand.candidate_id)}
              onToggleCompare={onToggleCompare}
              knockoutResult={knockoutResultsMap[cand.candidate_id]}
              onUpdateRating={onUpdateCandidateRating}
              onUpdateStage={onUpdateCandidateStage}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateList;
