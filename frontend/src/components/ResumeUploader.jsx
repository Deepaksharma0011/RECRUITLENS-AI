import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Trash2, Sparkles } from 'lucide-react';

const ResumeUploader = ({ onFilesSelected, files, parsedCount, isLoading }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div className="panel-card">
      <div className="section-title-row">
        <h2 className="section-title">
          <UploadCloud size={20} color="#6366f1" />
          <span>1. Upload Candidate Resumes</span>
        </h2>
        {parsedCount > 0 && (
          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={14} /> {parsedCount} Resumes Loaded
          </span>
        )}
      </div>

      <div
        className={`dropzone ${isDragOver ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        {/* 3D Hologram Laser Scan Line */}
        <div className="hologram-laser-line"></div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".pdf,.docx,.doc,.txt"
          style={{ display: 'none' }}
        />
        <div className="dropzone-icon">
          <UploadCloud size={26} />
        </div>
        <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
          Drag & Drop Candidate Resumes Here
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Supports PDF, DOCX, DOC, and TXT formats
        </p>
      </div>

      {files && files.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Selected Files ({files.length}):
          </p>
          {files.map((file, idx) => (
            <div key={idx} className="uploaded-file-tag">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 600 }}>
                <FileText size={15} color="#06b6d4" />
                {file.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;
