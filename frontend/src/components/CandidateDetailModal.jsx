import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle, AlertTriangle, MessageSquareText, HelpCircle,
  ShieldCheck, Copy, Check, Sparkles, Mail, Calendar, Star,
  Repeat, Clock, FileText, Send, BookOpen, UserCheck, Tag, Plus
} from 'lucide-react';
import { explainCandidate, generateQuestions, generateEmails, generateOnboarding, updateCandidateStatus } from '../services/api';

const CandidateDetailModal = ({
  candidate,
  onClose,
  blindMode,
  onUpdateCandidate,
  onOpenSplitViewer
}) => {
  const [activeTab, setActiveTab] = useState('explanation'); 
  // 'explanation' | 'questions' | 'emails' | 'onboarding' | 'anomalies' | 'skills' | 'sanitized'

  const [explanationData, setExplanationData] = useState(null);
  const [questionsData, setQuestionsData] = useState(null);
  const [emailsData, setEmailsData] = useState(null);
  const [onboardingData, setOnboardingData] = useState(null);

  const [loadingExp, setLoadingExp] = useState(false);
  const [loadingQs, setLoadingQs] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingOnboarding, setLoadingOnboarding] = useState(false);

  const [copiedIdx, setCopiedIdx] = useState(null);
  const [copiedEmailType, setCopiedEmailType] = useState(null);
  const [selectedEmailType, setSelectedEmailType] = useState('interview_invite');

  // Recruiter Internal State
  const [stage, setStage] = useState(candidate.stage || 'Screened');
  const [rating, setRating] = useState(candidate.rating || 0);
  const [notes, setNotes] = useState(candidate.recruiter_notes || '');
  const [tags, setTags] = useState(candidate.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);

  useEffect(() => {
    if (candidate) {
      setStage(candidate.stage || 'Screened');
      setRating(candidate.rating || 0);
      setNotes(candidate.recruiter_notes || '');
      setTags(candidate.tags || []);

      // 1. Fetch Score Explanation
      setLoadingExp(true);
      explainCandidate(candidate.candidate_id)
        .then(res => setExplanationData(res))
        .catch(err => console.error(err))
        .finally(() => setLoadingExp(false));

      // 2. Fetch Interview Questions & Rubrics
      setLoadingQs(true);
      generateQuestions(candidate.candidate_id)
        .then(res => setQuestionsData(res))
        .catch(err => console.error(err))
        .finally(() => setLoadingQs(false));
    }
  }, [candidate]);

  // Lazy-load emails when tab opened
  useEffect(() => {
    if (activeTab === 'emails' && !emailsData && candidate) {
      setLoadingEmails(true);
      generateEmails(candidate.candidate_id)
        .then(res => setEmailsData(res))
        .catch(err => console.error(err))
        .finally(() => setLoadingEmails(false));
    }
    if (activeTab === 'onboarding' && !onboardingData && candidate) {
      setLoadingOnboarding(true);
      generateOnboarding(candidate.candidate_id)
        .then(res => setOnboardingData(res))
        .catch(err => console.error(err))
        .finally(() => setLoadingOnboarding(false));
    }
  }, [activeTab, emailsData, onboardingData, candidate]);

  if (!candidate) return null;

  const displayName = blindMode
    ? `Candidate #${candidate.display_rank || 1} (Blind)`
    : candidate.candidate_name || 'Candidate';

  const handleCopyQuestion = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyEmail = (subject, body, type) => {
    const fullEmail = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullEmail);
    setCopiedEmailType(type);
    setTimeout(() => setCopiedEmailType(null), 2000);
  };

  const handleSaveRecruiterNotes = async () => {
    setSavingMeta(true);
    try {
      await updateCandidateStatus(candidate.candidate_id, {
        stage,
        rating,
        recruiter_notes: notes,
        tags
      });
      if (onUpdateCandidate) {
        onUpdateCandidate({
          ...candidate,
          stage,
          rating,
          recruiter_notes: notes,
          tags
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingMeta(false);
    }
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      const updated = [...tags, newTagInput.trim()];
      setTags(updated);
      setNewTagInput('');
      updateCandidateStatus(candidate.candidate_id, { tags: updated });
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updated = tags.filter(t => t !== tagToRemove);
    setTags(updated);
    updateCandidateStatus(candidate.candidate_id, { tags: updated });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '980px', width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Top Header */}
        <div className="modal-header" style={{ paddingBottom: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {displayName}
              </h2>
              <span className="skill-tag matched" style={{ fontSize: '0.8rem', padding: '0.2rem 0.65rem' }}>
                Score: {candidate.score}/100
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.15)', padding: '2px 8px', borderRadius: '10px' }}>
                {(candidate.semantic_similarity * 100).toFixed(0)}% Semantic Match
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {blindMode ? 'Demographic details sanitized' : `Resume: ${candidate.filename}`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {onOpenSplitViewer && (
              <button
                onClick={() => onOpenSplitViewer(candidate)}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                <FileText size={14} color="var(--accent-cyan)" />
                <span>Split Document Viewer</span>
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--border-color)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Recruiter Quick Status & Rating Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.6rem 1.25rem',
            background: 'var(--bg-dark)',
            borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          {/* Stage selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pipeline Stage:</span>
            <select
              value={stage}
              onChange={(e) => {
                setStage(e.target.value);
                updateCandidateStatus(candidate.candidate_id, { stage: e.target.value });
              }}
              style={{
                fontSize: '0.78rem',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '3px 8px',
                fontWeight: 600
              }}
            >
              <option value="Screened">📥 Screened</option>
              <option value="Shortlisted">🎯 Shortlisted</option>
              <option value="Interviewing">💬 Interviewing</option>
              <option value="Offered">🌟 Offered</option>
              <option value="Rejected">📁 Archived / Rejected</option>
            </select>
          </div>

          {/* Star rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recruiter Rating:</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={15}
                  fill={rating >= s ? '#f59e0b' : 'none'}
                  color={rating >= s ? '#f59e0b' : 'var(--text-dim)'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    const newR = rating === s ? 0 : s;
                    setRating(newR);
                    updateCandidateStatus(candidate.candidate_id, { rating: newR });
                  }}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {tags.map((t, idx) => (
              <span
                key={idx}
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--primary)',
                  fontSize: '0.72rem',
                  padding: '2px 7px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {t}
                <button onClick={() => handleRemoveTag(t)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: '0.7rem' }}>✕</button>
              </span>
            ))}
            <input
              type="text"
              placeholder="+ Tag"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
              style={{
                width: '60px',
                fontSize: '0.72rem',
                background: 'transparent',
                border: '1px dashed var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-main)',
                padding: '2px 6px'
              }}
            />
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="modal-tabs" style={{ overflowX: 'auto' }}>
          <button
            className={`tab-btn ${activeTab === 'explanation' ? 'active' : ''}`}
            onClick={() => setActiveTab('explanation')}
          >
            <MessageSquareText size={15} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
            Match Rationale
          </button>
          <button
            className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            <HelpCircle size={15} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
            Interview Rubrics ({questionsData?.questions?.length || 0})
          </button>
          <button
            className={`tab-btn ${activeTab === 'emails' ? 'active' : ''}`}
            onClick={() => setActiveTab('emails')}
          >
            <Mail size={15} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
            AI Email Drafter
          </button>
          <button
            className={`tab-btn ${activeTab === 'onboarding' ? 'active' : ''}`}
            onClick={() => setActiveTab('onboarding')}
          >
            <Calendar size={15} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
            30-60-90 Onboarding
          </button>
          <button
            className={`tab-btn ${activeTab === 'anomalies' ? 'active' : ''}`}
            onClick={() => setActiveTab('anomalies')}
          >
            <AlertTriangle size={15} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
            Anomaly & Red Flags ({candidate.anomalies?.length || 0})
          </button>
          <button
            className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            <CheckCircle size={15} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
            Matched Skills
          </button>
          <button
            className={`tab-btn ${activeTab === 'sanitized' ? 'active' : ''}`}
            onClick={() => setActiveTab('sanitized')}
          >
            <ShieldCheck size={15} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
            EEOC Blind Text
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
          
          {/* TAB 1: MATCH RATIONALE */}
          {activeTab === 'explanation' && (
            <div>
              {loadingExp ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ width: '30px', height: '30px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Asking GPT for candidate match score explanation...</p>
                </div>
              ) : explanationData ? (
                <div>
                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
                    <h4 style={{ color: 'var(--primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} /> AI Match Rationale Summary
                    </h4>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.65', color: 'var(--text-main)' }}>
                      {explanationData.explanation}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                      <h4 style={{ color: '#34d399', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={15} /> Key Domain Strengths
                      </h4>
                      <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {explanationData.key_strengths?.map((str, idx) => (
                          <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginBottom: '0.5rem', paddingLeft: '1.2rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0, color: '#34d399' }}>✓</span>
                            {str}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                      <h4 style={{ color: '#f87171', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={15} /> Growth & Verification Gaps
                      </h4>
                      <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {explanationData.potential_gaps?.map((gap, idx) => (
                          <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginBottom: '0.5rem', paddingLeft: '1.2rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0, color: '#f87171' }}>•</span>
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Could not load explanation.</p>
              )}
            </div>
          )}

          {/* TAB 2: INTERVIEW QUESTIONS & RUBRICS */}
          {activeTab === 'questions' && (
            <div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                Hiring manager interview scorecard with evaluation rubrics, key signals, and green/red flags:
              </p>

              {loadingQs ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ width: '30px', height: '30px', border: '3px solid var(--accent-cyan)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Generating interview questions & rubrics...</p>
                </div>
              ) : questionsData?.questions?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {questionsData.questions.map((q, idx) => (
                    <div key={idx} className="question-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <span className="question-cat">Q{idx + 1} • {q.category}</span>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                          onClick={() => handleCopyQuestion(q.question, idx)}
                        >
                          {copiedIdx === idx ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                          <span>{copiedIdx === idx ? 'Copied' : 'Copy Question'}</span>
                        </button>
                      </div>

                      <p className="question-text">"{q.question}"</p>
                      <p className="question-rationale">
                        <strong style={{ color: 'var(--text-main)' }}>Rationale:</strong> {q.rationale}
                      </p>

                      {/* Expected Answer & Flags */}
                      {q.expected_answer && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', marginTop: '0.75rem' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Sparkles size={13} /> Expected Key Technical Signals:
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', margin: 0, lineHeight: '1.5' }}>{q.expected_answer}</p>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                            {q.green_flags?.length > 0 && (
                              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                                <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>🟢 Green Flags (Look for):</span>
                                <ul style={{ margin: '4px 0 0 0', paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-body)', lineHeight: '1.4' }}>
                                  {q.green_flags.map((g, gIdx) => <li key={gIdx}>{g}</li>)}
                                </ul>
                              </div>
                            )}
                            {q.red_flags?.length > 0 && (
                              <div style={{ background: 'rgba(244, 63, 94, 0.05)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(244, 63, 94, 0.15)' }}>
                                <span style={{ color: '#f43f5e', fontSize: '0.75rem', fontWeight: 700 }}>🔴 Red Flags (Be cautious of):</span>
                                <ul style={{ margin: '4px 0 0 0', paddingLeft: '1.1rem', fontSize: '0.78rem', color: 'var(--text-body)', lineHeight: '1.4' }}>
                                  {q.red_flags.map((r, rIdx) => <li key={rIdx}>{r}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No interview questions generated yet.</p>
              )}
            </div>
          )}

          {/* TAB 3: AI RECRUITER EMAIL DRAFTER */}
          {activeTab === 'emails' && (
            <div>
              {loadingEmails ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ width: '30px', height: '30px', border: '3px solid var(--accent-purple)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Generating customized recruiter outreach emails...</p>
                </div>
              ) : emailsData?.emails?.length > 0 ? (
                <div>
                  {/* Email Type Selector */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {emailsData.emails.map((eItem) => (
                      <button
                        key={eItem.template_type}
                        onClick={() => setSelectedEmailType(eItem.template_type)}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: selectedEmailType === eItem.template_type ? 'var(--primary)' : 'var(--bg-dark)',
                          color: selectedEmailType === eItem.template_type ? '#fff' : 'var(--text-muted)',
                          border: `1px solid ${selectedEmailType === eItem.template_type ? 'var(--primary)' : 'var(--border-color)'}`
                        }}
                      >
                        {eItem.title}
                      </button>
                    ))}
                  </div>

                  {/* Active Email Preview */}
                  {emailsData.emails.filter(e => e.template_type === selectedEmailType).map((eItem, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Subject Line</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>{eItem.subject}</div>
                        </div>
                        <button
                          className="btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                          onClick={() => handleCopyEmail(eItem.subject, eItem.body, eItem.template_type)}
                        >
                          {copiedEmailType === eItem.template_type ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedEmailType === eItem.template_type ? 'Copied to Clipboard!' : '1-Click Copy Draft'}</span>
                        </button>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Email Body:
                      </div>
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.88rem', lineHeight: '1.7', color: 'var(--text-main)', background: 'var(--bg-surface)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        {eItem.body}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Could not load email templates.</p>
              )}
            </div>
          )}

          {/* TAB 4: 30-60-90 DAY ONBOARDING PLAN */}
          {activeTab === 'onboarding' && (
            <div>
              {loadingOnboarding ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ width: '30px', height: '30px', border: '3px solid var(--accent-cyan)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Building 30-60-90 Day ramp-up plan tailored to candidate...</p>
                </div>
              ) : onboardingData ? (
                <div>
                  <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
                    <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      🎯 Candidate Ramp-Up Strategy
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: 0 }}>
                      {onboardingData.summary}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {(onboardingData.phases || []).map((phase, pIdx) => (
                      <div key={pIdx} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase' }}>
                          {phase.days}
                        </div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 8px 0' }}>
                          {phase.title}
                        </h4>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                          Focus: {phase.focus}
                        </div>

                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>Milestones:</div>
                        <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {(phase.milestones || []).map((m, mIdx) => (
                            <li key={mIdx} style={{ marginBottom: '4px' }}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Onboarding plan unavailable.</p>
              )}
            </div>
          )}

          {/* TAB 5: ANOMALIES & RED FLAGS */}
          {activeTab === 'anomalies' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Resume Timeline & Integrity Scan
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Automated checks for employment gaps, rapid job transitions, and keyword density
                  </p>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: candidate.integrity_score >= 80 ? '#10b981' : '#f59e0b', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', padding: '4px 12px', borderRadius: '12px' }}>
                  {candidate.integrity_score || 100}% Health Score
                </div>
              </div>

              {candidate.anomalies?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {candidate.anomalies.map((a, aIdx) => (
                    <div
                      key={aIdx}
                      style={{
                        background: 'rgba(244, 63, 94, 0.08)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 700, fontSize: '0.88rem' }}>
                        <AlertTriangle size={16} />
                        <span>{a.title}</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '6px 0 0 0', lineHeight: '1.5' }}>
                        {a.detail}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center' }}>
                  <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 0.5rem auto' }} />
                  <h4 style={{ color: '#10b981', margin: '0 0 4px 0' }}>All Integrity Checks Passed</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    No anomalous employment gaps, short stint frequency, or unnatural keyword stuffing detected.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: MATCHED SKILLS */}
          {activeTab === 'skills' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ background: 'var(--bg-dark)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <h4 style={{ color: '#34d399', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={18} /> Matched Skills ({candidate.matched_skills?.length || 0})
                </h4>
                <div className="skills-wrap">
                  {(candidate.matched_skills || []).map((skill, idx) => (
                    <span key={idx} className="skill-tag matched" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--bg-dark)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <h4 style={{ color: '#f87171', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={18} /> Missing Required Skills ({candidate.missing_skills?.length || 0})
                </h4>
                <div className="skills-wrap">
                  {(candidate.missing_skills || []).map((skill, idx) => (
                    <span key={idx} className="skill-tag missing" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                      ✗ {skill}
                    </span>
                  ))}
                  {candidate.missing_skills?.length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: '#34d399' }}>All key job requirements are matched!</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DEMOGRAPHIC BIAS SANITIZED TEXT */}
          {activeTab === 'sanitized' && (
            <div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} /> Demographic Bias Removal Active
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Prior to vector embedding computation, candidate names, gender pronouns, contact details, and institutional pedigree were automatically masked.
                </p>
              </div>

              <pre className="code-preview" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {candidate.sanitized_preview || candidate.raw_text || "Sanitized preview text unavailable."}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer: Recruiter Notes Editor */}
        <div style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-dark)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Add internal recruiter feedback / notes for this candidate..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRecruiterNotes(); }}
            style={{
              flex: 1,
              padding: '0.45rem 0.85rem',
              fontSize: '0.82rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-main)'
            }}
          />
          <button
            onClick={handleSaveRecruiterNotes}
            className="btn-secondary"
            disabled={savingMeta}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
          >
            {savingMeta ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailModal;
