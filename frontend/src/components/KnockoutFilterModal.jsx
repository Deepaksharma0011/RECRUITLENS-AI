import React, { useState } from 'react';
import { X, Filter, AlertOctagon, CheckCircle2, ShieldAlert, Plus, Trash2 } from 'lucide-react';

const KnockoutFilterModal = ({
  allJdSkills = [],
  knockoutConfig,
  setKnockoutConfig,
  onClose
}) => {
  const [minExp, setMinExp] = useState(knockoutConfig.minExp || 0);
  const [minScore, setMinScore] = useState(knockoutConfig.minScore || 0);
  const [mandatorySkills, setMandatorySkills] = useState(knockoutConfig.mandatorySkills || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [hideKnockedOut, setHideKnockedOut] = useState(knockoutConfig.hideKnockedOut || false);

  const handleToggleSkill = (skill) => {
    if (mandatorySkills.includes(skill)) {
      setMandatorySkills(mandatorySkills.filter(s => s !== skill));
    } else {
      setMandatorySkills([...mandatorySkills, skill]);
    }
  };

  const handleAddCustomMandatory = () => {
    if (newSkillInput.trim() && !mandatorySkills.includes(newSkillInput.trim())) {
      setMandatorySkills([...mandatorySkills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const handleApply = () => {
    setKnockoutConfig({
      active: minExp > 0 || minScore > 0 || mandatorySkills.length > 0,
      minExp: Number(minExp),
      minScore: Number(minScore),
      mandatorySkills,
      hideKnockedOut
    });
    onClose();
  };

  const handleReset = () => {
    setMinExp(0);
    setMinScore(0);
    setMandatorySkills([]);
    setHideKnockedOut(false);
    setKnockoutConfig({
      active: false,
      minExp: 0,
      minScore: 0,
      mandatorySkills: [],
      hideKnockedOut: false
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '650px', width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '0.5rem', borderRadius: '50%' }}>
              <AlertOctagon size={22} color="#f43f5e" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Hard Filters & Knockout Criteria
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Define non-negotiable threshold rules to instantly flag or filter unqualified candidates
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--border-color)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Rule 1: Minimum Experience */}
          <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Minimum Years of Experience:
              </label>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {minExp > 0 ? `${minExp}+ Years` : 'No Minimum (Any)'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={minExp}
              onChange={(e) => setMinExp(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          {/* Rule 2: Minimum Match Score */}
          <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Knockout Score Threshold:
              </label>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f43f5e' }}>
                {minScore > 0 ? `Must score ≥ ${minScore}%` : 'Off (No cut-off)'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#f43f5e' }}
            />
          </div>

          {/* Rule 3: Mandatory Skills (Must Have) */}
          <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>
              Mandatory "Must-Have" Skills:
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Candidates missing ANY selected mandatory skill will be marked as Knocked Out.
            </p>

            {allJdSkills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
                {allJdSkills.map((skill, idx) => {
                  const isSelected = mandatorySkills.includes(skill);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleToggleSkill(skill)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.75rem',
                        borderRadius: '20px',
                        border: isSelected ? '1px solid #f43f5e' : '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(244, 63, 94, 0.2)' : 'var(--bg-surface)',
                        color: isSelected ? '#f43f5e' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: isSelected ? 700 : 500
                      }}
                    >
                      {isSelected ? '⛔ ' : '+ '} {skill}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Custom skill adder */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Add custom mandatory skill (e.g. AWS Certified, Lead)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomMandatory(); }}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-main)'
                }}
              />
              <button
                onClick={handleAddCustomMandatory}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Option: Hide Knocked Out Candidates */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={hideKnockedOut}
              onChange={(e) => setHideKnockedOut(e.target.checked)}
            />
            <span>Automatically hide knocked-out candidates from list</span>
          </label>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              onClick={handleReset}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem' }}
            >
              Reset Rules
            </button>
            <button
              onClick={handleApply}
              className="btn-primary"
              style={{ padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg, #f43f5e, var(--primary))' }}
            >
              Apply Knockout Criteria
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnockoutFilterModal;
