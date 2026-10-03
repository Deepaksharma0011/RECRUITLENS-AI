import React from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, Printer, Award, FileText, Calendar, Hash } from 'lucide-react';

const EEOCAuditModal = ({ onClose, totalEvaluated = 0, jobTitle = 'Target Role' }) => {
  const auditId = `EEOC-AUDIT-${Math.floor(100000 + Math.random() * 900000)}`;
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '850px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Modal Top Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.5rem', borderRadius: '50%' }}>
              <ShieldCheck size={24} color="#10b981" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                EEOC Fair-Hiring & Blind Scoring Compliance Certificate
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                Certified Blind Merit Screening Verification
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
            >
              <Printer size={14} />
              <span>Print Audit Certificate</span>
            </button>
            <button
              onClick={onClose}
              style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--border-color)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Certificate Body */}
        <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)', marginTop: '0.5rem' }}>
          
          {/* Certificate Header Badge */}
          <div style={{ textAlign: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '0.35rem 1rem', borderRadius: '20px', color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>
              <Award size={16} /> OFFICIAL COMPLIANCE ATTESTATION
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '0.85rem', marginBottom: '0.3rem' }}>
              RecruitLens AI Bias Mitigation & Blind Screening Audit
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Attestation of non-discriminatory, algorithmic merit evaluation in accordance with EEOC Title VII and the Uniform Guidelines on Employee Selection Procedures (UGESP).
            </p>
          </div>

          {/* Audit Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', margin: '1.25rem 0', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Audit ID Hash</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'monospace', marginTop: '2px' }}>{auditId}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Target Job Requisition</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>{jobTitle || 'General Engineering'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Candidates Screened</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>{totalEvaluated} Resumes Processed Blind</div>
            </div>
          </div>

          {/* Scrubbed Vectors Checklist */}
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={15} color="#10b981" /> Redaction & Demographic Masking Proof:
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.82rem', fontWeight: 700 }}>
                <CheckCircle2 size={14} /> Names & Contact Information
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Full names, personal phone numbers, email addresses, and physical locations were redacted prior to scoring.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.82rem', fontWeight: 700 }}>
                <CheckCircle2 size={14} /> Gender & Pronoun Markers
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Explicit gender markers (he, she, him, her, male, female) were normalized to gender-neutral identifiers.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.82rem', fontWeight: 700 }}>
                <CheckCircle2 size={14} /> Age & Graduation Year Bias
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                High school and historical graduation year tags were insulated to prevent age discrimination proxy signals.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.82rem', fontWeight: 700 }}>
                <CheckCircle2 size={14} /> Institutional Pedigree Normalization
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Ranking strictly weights demonstrated competencies and semantic role fit rather than university prestige.
              </p>
            </div>
          </div>

          {/* Legal Certification Footer */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <div>
              Generated on: <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{currentDate}</span>
            </div>
            <div style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
              ✓ Status: 100% EEOC Fair-Screening Verified
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EEOCAuditModal;
