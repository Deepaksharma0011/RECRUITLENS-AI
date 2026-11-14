import React from 'react';
import { X, ShieldCheck, Printer } from 'lucide-react';

const EEOCAuditModal = ({ onClose, totalEvaluated = 0, jobTitle }) => (
  <div className="modal-overlay screening-summary-overlay" onClick={onClose}>
    <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="screening-summary-title"
      onClick={(event) => event.stopPropagation()}>
      <div className="modal-header">
        <h2 id="screening-summary-title"><ShieldCheck size={20} /> Screening Summary</h2>
        <button className="btn-secondary" onClick={() => window.print()}>
          <Printer size={14} /> Print Summary
        </button>
        <button className="btn-secondary" aria-label="Close screening summary" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div style={{ padding: '1.25rem' }}>
        <p><strong>Role</strong> {jobTitle || 'No role selected'}</p>
        <p><strong>Candidates evaluated</strong> {totalEvaluated}</p>
        <p>Resume redaction masks detected personal details in the redacted view. Review the output for missed details.</p>
        <p>Independent fairness and compliance verification requires a separate assessment.</p>
      </div>
    </div>
  </div>
);

export default EEOCAuditModal;
