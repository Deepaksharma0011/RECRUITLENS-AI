import React, { useState, useEffect, useRef } from 'react';
import {
  X, CheckCircle, AlertTriangle, MessageSquareText, HelpCircle,
  ShieldCheck, Copy, Check, Sparkles, Mail, Calendar, Star,
  Repeat, Clock, FileText, Send, BookOpen, UserCheck, Tag, Plus,
  Volume2, VolumeX, Mic, DollarSign, TrendingUp, Award, Layers,
  Compass, FileCheck, RefreshCw, Printer, Briefcase
} from 'lucide-react';
import {
  explainCandidate,
  generateQuestions,
  generateEmails,
  generateOnboarding,
  updateCandidateStatus,
  getRadarMetrics,
  simulateWhatIf,
  getCompensationBenchmark,
  generateOfferLetter
} from '../services/api';

const CandidateDetailModal = ({
  candidate,
  onClose,
  blindMode,
  onUpdateCandidate,
  onOpenSplitViewer
}) => {
  const [activeTab, setActiveTab] = useState('explanation');
  // 'explanation' | 'questions' | 'radar' | 'whatif' | 'compensation' | 'offer' | 'emails' | 'onboarding' | 'anomalies' | 'skills' | 'sanitized'

  const [explanationData, setExplanationData] = useState(null);
  const [questionsData, setQuestionsData] = useState(null);
  const [emailsData, setEmailsData] = useState(null);
  const [onboardingData, setOnboardingData] = useState(null);
  const [radarData, setRadarData] = useState(null);
  const [compensationData, setCompensationData] = useState(null);
  const [offerLetterData, setOfferLetterData] = useState(null);
  const [whatIfResult, setWhatIfResult] = useState(null);

  const [loadingExp, setLoadingExp] = useState(false);
  const [loadingQs, setLoadingQs] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingOnboarding, setLoadingOnboarding] = useState(false);
  const [loadingRadar, setLoadingRadar] = useState(false);
  const [loadingComp, setLoadingComp] = useState(false);
  const [loadingOffer, setLoadingOffer] = useState(false);
  const [loadingWhatIf, setLoadingWhatIf] = useState(false);

  const [copiedIdx, setCopiedIdx] = useState(null);
  const [copiedEmailType, setCopiedEmailType] = useState(null);
  const [selectedEmailType, setSelectedEmailType] = useState('interview_invite');
  const [offerCopied, setOfferCopied] = useState(false);

  // Recruiter Internal State
  const [stage, setStage] = useState(candidate.stage || 'Screened');
  const [rating, setRating] = useState(candidate.rating || 0);
  const [notes, setNotes] = useState(candidate.recruiter_notes || '');
  const [tags, setTags] = useState(candidate.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);

  // Voice Interview Practice State
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [speechRate, setSpeechRate] = useState(1.0);

  // What-If Simulator State
  const [selectedWhatIfSkills, setSelectedWhatIfSkills] = useState([]);
  const [customWhatIfSkill, setCustomWhatIfSkill] = useState('');

  // Compensation Custom Budget Filter
  const [recruiterBudget, setRecruiterBudget] = useState(130000);

  // Offer Letter Custom Form State
  const [offerParams, setOfferParams] = useState({
    job_title: '',
    base_salary: '$135,000 / ₹28,00,000 per annum',
    sign_on_bonus: '$10,000 / ₹2,00,000',
    equity_rsu: '0.15% Equity Options (4-year vesting)',
    start_date: 'Two weeks from offer acceptance',
    manager_name: 'Engineering Director / Hiring Manager',
    work_mode: 'Hybrid (3 days in office, 2 days remote)'
  });

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

  // Clean up any ongoing TTS when unmounting or switching tabs
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Lazy-load data based on active tab
  useEffect(() => {
    if (!candidate) return;

    if (activeTab === 'emails' && !emailsData) {
      setLoadingEmails(true);
      generateEmails(candidate.candidate_id)
        .then(res => setEmailsData(res))
        .catch(err => console.error(err))
        .finally(() => setLoadingEmails(false));
    }
    if (activeTab === 'onboarding' && !onboardingData) {
      setLoadingOnboarding(true);
      generateOnboarding(candidate.candidate_id)
        .then(res => setOnboardingData(res))
        .catch(err => console.error(err))
        .finally(() => setLoadingOnboarding(false));
    }
    if (activeTab === 'radar' && !radarData) {
      setLoadingRadar(true);
      getRadarMetrics(candidate.candidate_id)
        .then(res => setRadarData(res))
        .catch(err => console.error(err))
        .finally(() => setLoadingRadar(false));
    }
    if (activeTab === 'compensation' && !compensationData) {
      setLoadingComp(true);
      getCompensationBenchmark(candidate.candidate_id)
        .then(res => {
          setCompensationData(res);
          if (res?.percentiles?.median_usd) {
            setRecruiterBudget(res.percentiles.median_usd);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingComp(false));
    }
    if (activeTab === 'offer' && !offerLetterData) {
      setLoadingOffer(true);
      generateOfferLetter(candidate.candidate_id, offerParams)
        .then(res => setOfferLetterData(res))
        .catch(err => console.error(err))
        .finally(() => setLoadingOffer(false));
    }
  }, [activeTab, candidate, emailsData, onboardingData, radarData, compensationData, offerLetterData]);

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

  const handleCopyOfferLetter = () => {
    if (!offerLetterData?.offer_letter_text) return;
    navigator.clipboard.writeText(offerLetterData.offer_letter_text);
    setOfferCopied(true);
    setTimeout(() => setOfferCopied(false), 2000);
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

  // Text-To-Speech handler for voice simulator
  const handleToggleSpeak = (text, idx) => {
    if (!window.speechSynthesis) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    
    // Choose natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David')));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  // What-If Simulation Trigger
  const handleRunWhatIf = async () => {
    if (selectedWhatIfSkills.length === 0) {
      alert('Please select or type at least one missing skill to simulate.');
      return;
    }
    setLoadingWhatIf(true);
    try {
      const result = await simulateWhatIf(candidate.candidate_id, selectedWhatIfSkills);
      setWhatIfResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWhatIf(false);
    }
  };

  const handleRegenerateOffer = async () => {
    setLoadingOffer(true);
    try {
      const res = await generateOfferLetter(candidate.candidate_id, offerParams);
      setOfferLetterData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOffer(false);
    }
  };

  // Helper to render SVG Radar
  const renderRadarChart = (axes) => {
    if (!axes || axes.length === 0) return null;
    const size = 320;
    const center = size / 2;
    const radius = 105;
    const totalAxes = axes.length;
    const angleSlice = (Math.PI * 2) / totalAxes;

    // Grid circles / polygons
    const levels = [0.25, 0.5, 0.75, 1.0];

    const getCoordinates = (index, value) => {
      const angle = index * angleSlice - Math.PI / 2;
      const r = (value / 100) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle)
      };
    };

    const polygonPoints = axes.map((axis, i) => {
      const coords = getCoordinates(i, axis.score);
      return `${coords.x},${coords.y}`;
    }).join(' ');

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        {/* Background Grid webs */}
        {levels.map((lvl, lIdx) => {
          const gridPoints = axes.map((_, i) => {
            const coords = getCoordinates(i, lvl * 100);
            return `${coords.x},${coords.y}`;
          }).join(' ');
          return (
            <g key={lIdx}>
              <polygon
                points={gridPoints}
                fill={lIdx === levels.length - 1 ? 'rgba(99, 102, 241, 0.04)' : 'none'}
                stroke="var(--border-color)"
                strokeWidth="1"
                strokeDasharray={lIdx === levels.length - 1 ? 'none' : '2,3'}
              />
              <text
                x={center + 4}
                y={center - (lvl * radius) + 3}
                fill="var(--text-dim)"
                fontSize="8"
                fontWeight="600"
              >
                {(lvl * 100).toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Axis Spokes */}
        {axes.map((axis, i) => {
          const outer = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--border-color)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(99, 102, 241, 0.35)"
          stroke="var(--primary)"
          strokeWidth="2.5"
          style={{ filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))' }}
        />

        {/* Data Vertices */}
        {axes.map((axis, i) => {
          const coords = getCoordinates(i, axis.score);
          return (
            <g key={i}>
              <circle
                cx={coords.x}
                cy={coords.y}
                r="4.5"
                fill="var(--accent-cyan)"
                stroke="#fff"
                strokeWidth="1.5"
              />
            </g>
          );
        })}

        {/* Axis Labels */}
        {axes.map((axis, i) => {
          const labelCoords = getCoordinates(i, 122);
          const anchor = labelCoords.x > center + 10 ? 'start' : labelCoords.x < center - 10 ? 'end' : 'middle';
          return (
            <text
              key={i}
              x={labelCoords.x}
              y={labelCoords.y + 4}
              textAnchor={anchor}
              fill="var(--text-main)"
              fontSize="9.5"
              fontWeight="700"
            >
              {axis.axis} ({axis.score}%)
            </text>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1080px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
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
              {candidate.adversarial_safe && (
                <span style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} /> Prompt Guard Verified
                </span>
              )}
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
        <div className="modal-tabs" style={{ overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', gap: '4px', padding: '0.5rem 1rem' }}>
          <button
            className={`tab-btn ${activeTab === 'explanation' ? 'active' : ''}`}
            onClick={() => setActiveTab('explanation')}
          >
            <MessageSquareText size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Match Rationale
          </button>
          <button
            className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            <Volume2 size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Voice Interview Lab ({questionsData?.questions?.length || 0})
          </button>
          <button
            className={`tab-btn ${activeTab === 'radar' ? 'active' : ''}`}
            onClick={() => setActiveTab('radar')}
          >
            <Compass size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Radar Competency
          </button>
          <button
            className={`tab-btn ${activeTab === 'whatif' ? 'active' : ''}`}
            onClick={() => setActiveTab('whatif')}
          >
            <TrendingUp size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            What-If Simulator
          </button>
          <button
            className={`tab-btn ${activeTab === 'compensation' ? 'active' : ''}`}
            onClick={() => setActiveTab('compensation')}
          >
            <DollarSign size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Salary Benchmark
          </button>
          <button
            className={`tab-btn ${activeTab === 'offer' ? 'active' : ''}`}
            onClick={() => setActiveTab('offer')}
          >
            <FileCheck size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            AI Offer Letter
          </button>
          <button
            className={`tab-btn ${activeTab === 'emails' ? 'active' : ''}`}
            onClick={() => setActiveTab('emails')}
          >
            <Mail size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Outreach Emails
          </button>
          <button
            className={`tab-btn ${activeTab === 'onboarding' ? 'active' : ''}`}
            onClick={() => setActiveTab('onboarding')}
          >
            <Calendar size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            30-60-90 Plan
          </button>
          <button
            className={`tab-btn ${activeTab === 'anomalies' ? 'active' : ''}`}
            onClick={() => setActiveTab('anomalies')}
          >
            <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Anomalies ({candidate.anomalies?.length || 0})
          </button>
          <button
            className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Skills ({candidate.matched_skills?.length || 0})
          </button>
          <button
            className={`tab-btn ${activeTab === 'sanitized' ? 'active' : ''}`}
            onClick={() => setActiveTab('sanitized')}
          >
            <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            EEOC Blind Text
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          
          {/* TAB 1: MATCH RATIONALE */}
          {activeTab === 'explanation' && (
            <div>
              {loadingExp ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ width: '30px', height: '30px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Asking LLM for candidate match score explanation...</p>
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

          {/* TAB 2: INTERVIEW QUESTIONS & VOICE SIMULATOR */}
          {activeTab === 'questions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '0.85rem 1.25rem', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Volume2 size={16} /> AI Voice Interview Audio Room
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Listen to AI speak interview questions aloud for rehearsal or candidate mock screenings
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Audio Speed:</span>
                  <select
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.78rem', padding: '2px 6px' }}
                  >
                    <option value={0.85}>0.85x (Slow)</option>
                    <option value={1.0}>1.0x (Normal)</option>
                    <option value={1.2}>1.2x (Fast)</option>
                  </select>
                </div>
              </div>

              {loadingQs ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ width: '30px', height: '30px', border: '3px solid var(--accent-cyan)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Generating tailored interview questions & rubrics...</p>
                </div>
              ) : questionsData?.questions?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {questionsData.questions.map((q, idx) => (
                    <div key={idx} className="question-card" style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <span className="question-cat">Q{idx + 1} • {q.category}</span>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn-secondary"
                            style={{
                              padding: '0.3rem 0.65rem',
                              fontSize: '0.78rem',
                              background: speakingIdx === idx ? 'rgba(6, 182, 212, 0.2)' : undefined,
                              borderColor: speakingIdx === idx ? 'var(--accent-cyan)' : undefined,
                              color: speakingIdx === idx ? 'var(--accent-cyan)' : undefined
                            }}
                            onClick={() => handleToggleSpeak(q.question, idx)}
                          >
                            {speakingIdx === idx ? <VolumeX size={13} /> : <Volume2 size={13} />}
                            <span>{speakingIdx === idx ? 'Stop Audio' : 'Speak Question'}</span>
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                            onClick={() => handleCopyQuestion(q.question, idx)}
                          >
                            {copiedIdx === idx ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                            <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <p className="question-text" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        "{q.question}"
                      </p>
                      <p className="question-rationale" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text-main)' }}>Rationale:</strong> {q.rationale}
                      </p>

                      {/* Expected Answer & Signal Flags */}
                      {q.expected_answer && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', marginTop: '0.75rem' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Sparkles size={13} /> Expected Technical & Strategic Signals:
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

          {/* TAB 3: MULTI-AXIS COMPETENCY RADAR & TEAM COMPLEMENTARITY */}
          {activeTab === 'radar' && (
            <div>
              {loadingRadar ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ width: '30px', height: '30px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Computing 6-axis competency radar and team complementarity...</p>
                </div>
              ) : radarData ? (
                <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                  {/* Left Column: Visual Radar */}
                  <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h4 style={{ color: 'var(--primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Compass size={16} /> 6-Axis Competency Polygon
                    </h4>
                    {renderRadarChart(radarData.radar_axes)}
                  </div>

                  {/* Right Column: Breakdown & Team Complementarity */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Team Superpower Card */}
                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.06em' }}>
                          ⚡ Team Complementarity Superpower
                        </span>
                        <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                          {radarData.team_complementarity?.team_fit_score || 88}% Fit
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.4rem 0' }}>
                        {radarData.team_complementarity?.role_superpower || "Versatile Execution Anchor"}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', margin: 0, lineHeight: '1.5' }}>
                        {radarData.team_complementarity?.complementary_analysis}
                      </p>
                    </div>

                    {/* Axis Breakdown Score Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {radarData.radar_axes?.map((axis, aIdx) => (
                        <div key={aIdx} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{axis.axis}</span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: axis.score >= 80 ? '#10b981' : axis.score >= 65 ? 'var(--accent-cyan)' : '#f59e0b' }}>
                              {axis.score}/100
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div style={{ height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                            <div style={{ width: `${axis.score}%`, height: '100%', background: axis.score >= 80 ? '#10b981' : 'var(--primary)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                          </div>
                          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                            {axis.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Could not load competency radar.</p>
              )}
            </div>
          )}

          {/* TAB 4: WHAT-IF COUNTERFACTUAL UPSKILLING SIMULATOR */}
          {activeTab === 'whatif' && (
            <div>
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <h4 style={{ color: '#f59e0b', fontSize: '0.88rem', fontWeight: 700, margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={16} /> AI Counterfactual "What-If" Upskilling Sandbox
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', margin: 0, lineHeight: '1.5' }}>
                  Simulate what this candidate's match score and pipeline rank would become if given targeted training or ramp-up on their missing skills.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* Left: Skill Selection & Controls */}
                <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                    1. Select Missing Skills to Simulate Acquiring:
                  </h4>

                  {candidate.missing_skills?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                      {candidate.missing_skills.map((skill, sIdx) => {
                        const isChecked = selectedWhatIfSkills.includes(skill);
                        return (
                          <label
                            key={sIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '0.82rem',
                              color: isChecked ? 'var(--accent-cyan)' : 'var(--text-body)',
                              cursor: 'pointer',
                              background: isChecked ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-surface)',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: `1px solid ${isChecked ? 'var(--accent-cyan)' : 'var(--border-color)'}`
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedWhatIfSkills(selectedWhatIfSkills.filter(s => s !== skill));
                                } else {
                                  setSelectedWhatIfSkills([...selectedWhatIfSkills, skill]);
                                }
                              }}
                            />
                            <span>{skill}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Candidate already possesses all core JD skills!</p>
                  )}

                  {/* Add Custom Skill to simulation */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      placeholder="Add hypothetical skill (e.g. AWS, GraphQL)..."
                      value={customWhatIfSkill}
                      onChange={(e) => setCustomWhatIfSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customWhatIfSkill.trim()) {
                          setSelectedWhatIfSkills([...selectedWhatIfSkills, customWhatIfSkill.trim()]);
                          setCustomWhatIfSkill('');
                        }
                      }}
                      style={{ flex: 1, fontSize: '0.8rem', padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                    />
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        if (customWhatIfSkill.trim()) {
                          setSelectedWhatIfSkills([...selectedWhatIfSkills, customWhatIfSkill.trim()]);
                          setCustomWhatIfSkill('');
                        }
                      }}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={handleRunWhatIf}
                    disabled={loadingWhatIf}
                    style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    {loadingWhatIf ? <RefreshCw size={14} className="spin" /> : <TrendingUp size={14} />}
                    <span>{loadingWhatIf ? 'Simulating Score Jump...' : 'Simulate Upskilling Impact'}</span>
                  </button>
                </div>

                {/* Right: Simulation Output */}
                <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                    2. Projected Match Impact:
                  </h4>

                  {whatIfResult ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Current Score</span>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                            {whatIfResult.original_score}/100
                          </div>
                        </div>

                        <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Simulated Score</span>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                            {whatIfResult.simulated_score}/100 (+{whatIfResult.score_delta} pts)
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                          💡 ROI & Ramp-Up Analysis
                        </div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                          {whatIfResult.roi_verdict}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                          Estimated Time to Full Productivity: ~{whatIfResult.estimated_ramp_up_weeks} weeks
                        </p>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Simulated Matched Stack:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {whatIfResult.simulated_matched_skills?.map((s, idx) => (
                            <span key={idx} className="skill-tag matched" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      <TrendingUp size={32} style={{ opacity: 0.3, margin: '0 auto 0.5rem auto' }} />
                      <p style={{ fontSize: '0.82rem', margin: 0 }}>
                        Select skills on the left and click "Simulate Upskilling Impact" to see projected score leap.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AI COMPENSATION BENCHMARK ESTIMATOR */}
          {activeTab === 'compensation' && (
            <div>
              {loadingComp ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ width: '30px', height: '30px', border: '3px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Analyzing market salary baselines, seniority depth, and skill premiums...</p>
                </div>
              ) : compensationData ? (
                <div>
                  {/* Percentile Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>25th Percentile</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                        ${(compensationData.percentiles?.p25_usd || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                        ₹{compensationData.percentiles?.p25_inr_lpa} LPA
                      </div>
                    </div>

                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', padding: '0.85rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>50th Percentile (Median)</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                        ${(compensationData.percentiles?.median_usd || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                        ₹{compensationData.percentiles?.median_inr_lpa} LPA
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>75th Percentile</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                        ${(compensationData.percentiles?.p75_usd || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                        ₹{compensationData.percentiles?.p75_inr_lpa} LPA
                      </div>
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '0.85rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>90th Percentile (Top Tier)</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                        ${(compensationData.percentiles?.p90_usd || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                        ₹{compensationData.percentiles?.p90_inr_lpa} LPA
                      </div>
                    </div>
                  </div>

                  {/* Budget Fit & Skill Premium Breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {/* Hiring Budget Fit Calculator */}
                    <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <DollarSign size={16} color="#10b981" /> Target Hiring Budget Fit Gauge
                      </h4>
                      
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Your Maximum Target Budget:</span>
                          <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>${recruiterBudget.toLocaleString()} USD</span>
                        </div>
                        <input
                          type="range"
                          min={compensationData.percentiles?.p25_usd * 0.7 || 50000}
                          max={compensationData.percentiles?.p90_usd * 1.3 || 250000}
                          step={2500}
                          value={recruiterBudget}
                          onChange={(e) => setRecruiterBudget(Number(e.target.value))}
                          style={{ width: '100%', cursor: 'pointer' }}
                        />
                      </div>

                      <div style={{
                        background: recruiterBudget >= (compensationData.percentiles?.median_usd || 0) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        border: `1px solid ${recruiterBudget >= (compensationData.percentiles?.median_usd || 0) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        borderRadius: '6px',
                        padding: '0.75rem'
                      }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: recruiterBudget >= (compensationData.percentiles?.median_usd || 0) ? '#10b981' : '#f59e0b' }}>
                          {recruiterBudget >= (compensationData.percentiles?.p75_usd || 0)
                            ? '✅ Highly Competitive — Top 25% Offer Potential'
                            : recruiterBudget >= (compensationData.percentiles?.median_usd || 0)
                            ? '👍 Healthy Budget Fit — Aligned with Market Median'
                            : '⚠️ Below Market Median — Consider Equity/Flexibility Boost'}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                          {compensationData.compensation_summary}
                        </p>
                      </div>
                    </div>

                    {/* Skill Premiums & Multipliers */}
                    <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Award size={16} color="var(--primary)" /> High-Value Skill Premiums
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(compensationData.skill_premiums || []).map((p, pIdx) => (
                          <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{p.skill}</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981' }}>+{p.premium_usd} ({p.inr_boost})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Could not load compensation benchmarks.</p>
              )}
            </div>
          )}

          {/* TAB 6: ONE-CLICK AI OFFER LETTER GENERATOR */}
          {activeTab === 'offer' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem' }}>
                {/* Left: Offer Parameters Editor */}
                <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileCheck size={16} color="var(--primary)" /> Contract Terms & Packages
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Base Salary Compensation</label>
                      <input
                        type="text"
                        value={offerParams.base_salary}
                        onChange={(e) => setOfferParams({ ...offerParams, base_salary: e.target.value })}
                        style={{ width: '100%', fontSize: '0.78rem', padding: '5px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', marginTop: '2px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Sign-on Bonus</label>
                      <input
                        type="text"
                        value={offerParams.sign_on_bonus}
                        onChange={(e) => setOfferParams({ ...offerParams, sign_on_bonus: e.target.value })}
                        style={{ width: '100%', fontSize: '0.78rem', padding: '5px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', marginTop: '2px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Equity / RSUs / Stock Options</label>
                      <input
                        type="text"
                        value={offerParams.equity_rsu}
                        onChange={(e) => setOfferParams({ ...offerParams, equity_rsu: e.target.value })}
                        style={{ width: '100%', fontSize: '0.78rem', padding: '5px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', marginTop: '2px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Work Model</label>
                      <select
                        value={offerParams.work_mode}
                        onChange={(e) => setOfferParams({ ...offerParams, work_mode: e.target.value })}
                        style={{ width: '100%', fontSize: '0.78rem', padding: '5px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', marginTop: '2px' }}
                      >
                        <option value="Hybrid (3 days in office, 2 days remote)">Hybrid (3 Days Office)</option>
                        <option value="100% Remote / Anywhere">100% Remote</option>
                        <option value="Onsite / In-Office">Onsite</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>Start Date</label>
                      <input
                        type="text"
                        value={offerParams.start_date}
                        onChange={(e) => setOfferParams({ ...offerParams, start_date: e.target.value })}
                        style={{ width: '100%', fontSize: '0.78rem', padding: '5px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', marginTop: '2px' }}
                      />
                    </div>

                    <button
                      className="btn-primary"
                      onClick={handleRegenerateOffer}
                      disabled={loadingOffer}
                      style={{ marginTop: '0.5rem', padding: '0.55rem', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      {loadingOffer ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
                      <span>{loadingOffer ? 'Drafting Contract...' : 'Update Offer Draft'}</span>
                    </button>
                  </div>
                </div>

                {/* Right: Formal Letter Preview */}
                <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      📄 Formal Employment Offer Letter Draft
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => window.print()}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      >
                        <Printer size={13} /> Print / PDF
                      </button>
                      <button
                        className="btn-primary"
                        onClick={handleCopyOfferLetter}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                      >
                        {offerCopied ? <Check size={13} /> : <Copy size={13} />}
                        <span>{offerCopied ? 'Copied Offer!' : '1-Click Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {loadingOffer ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                      <div style={{ width: '30px', height: '30px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Writing formal employment offer letter...</p>
                    </div>
                  ) : offerLetterData ? (
                    <pre style={{
                      flex: 1,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit',
                      fontSize: '0.85rem',
                      lineHeight: '1.7',
                      color: 'var(--text-main)',
                      background: 'var(--bg-surface)',
                      padding: '1.2rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      maxHeight: '400px',
                      overflowY: 'auto'
                    }}>
                      {offerLetterData.offer_letter_text}
                    </pre>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>Could not load offer letter.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AI RECRUITER EMAIL DRAFTER */}
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

          {/* TAB 8: 30-60-90 DAY ONBOARDING PLAN */}
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

          {/* TAB 9: ANOMALIES & INTEGRITY RED FLAGS */}
          {activeTab === 'anomalies' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Resume Timeline & Integrity Scan
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Automated checks for employment gaps, rapid job transitions, zero-width unicode, and adversarial prompt injections
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
                  <h4 style={{ color: '#10b981', margin: '0 0 4px 0' }}>All Integrity & Prompt Guard Checks Passed</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    No anomalous employment gaps, zero-width invisible text, short stint frequency, or prompt injection payloads detected.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: MATCHED SKILLS */}
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

          {/* TAB 11: DEMOGRAPHIC BIAS SANITIZED TEXT */}
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
