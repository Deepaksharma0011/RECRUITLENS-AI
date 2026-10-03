import React from 'react';
import { Sliders, RefreshCw } from 'lucide-react';

const WeightSliders = ({
  semanticWeight,
  setSemanticWeight,
  skillWeight,
  setSkillWeight,
  minScoreFilter,
  setMinScoreFilter,
  onResetWeights
}) => {

  const handleSemanticChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setSemanticWeight(val);
    setSkillWeight(100 - val);
  };

  const handleSkillChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setSkillWeight(val);
    setSemanticWeight(100 - val);
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sliders size={18} color="var(--accent-purple)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Dynamic Scoring & Weighting Engine
          </h3>
        </div>
        <button
          onClick={onResetWeights}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            cursor: 'pointer',
            fontWeight: 600
          }}
          title="Reset to Default (60% Semantic / 40% Skill)"
        >
          <RefreshCw size={12} />
          Reset (60/40)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {/* Semantic Similarity Weight Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--accent-purple)' }}>Semantic AI Embeddings</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{semanticWeight}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={semanticWeight}
            onChange={handleSemanticChange}
            style={{
              width: '100%',
              accentColor: 'var(--accent-purple)',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Weights NLP sentence relevance to JD
          </span>
        </div>

        {/* Hard Skill Match Weight Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--accent-cyan)' }}>Required Skill Match</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{skillWeight}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={skillWeight}
            onChange={handleSkillChange}
            style={{
              width: '100%',
              accentColor: 'var(--accent-cyan)',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Weights exact & fuzzy skill overlap
          </span>
        </div>

        {/* Min Score Threshold Filter */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--accent-emerald)' }}>Min Match Cutoff</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{minScoreFilter}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="5"
            value={minScoreFilter}
            onChange={(e) => setMinScoreFilter(parseInt(e.target.value, 10))}
            style={{
              width: '100%',
              accentColor: 'var(--accent-emerald)',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Filters out candidates below threshold
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeightSliders;
