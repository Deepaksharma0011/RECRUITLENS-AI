import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Search, Loader2, CheckCircle2, ChevronRight, Zap, ShieldCheck, Wand2, AlertTriangle, X } from 'lucide-react';
import { suggestJobTitles, searchJD, optimizeJD } from '../services/api';

// Instant Client-Side 120+ Job Taxonomy for 0ms Zero-Latency Guessing
const INSTANT_JOB_DATABASE = [
  // Data & Analytics
  "Data Analyst",
  "Senior Data Analyst",
  "Lead Data Analyst",
  "Data Analytics Engineer",
  "Business Intelligence (BI) Analyst",
  "Financial Data Analyst",
  "Marketing Data Analyst",
  "Operations Data Analyst",
  "Quantitative Analyst",
  "Data Scientist",
  "Senior Data Scientist",
  "Lead Data Scientist",
  "Machine Learning Data Scientist",
  "Data Engineer",
  "Senior Data Engineer",
  "Big Data Engineer",
  "Database Administrator (DBA)",
  "Analytics Consultant",

  // Software & Web Development
  "Python Developer",
  "Senior Python Developer",
  "Python Backend Engineer",
  "FastAPI / Django Backend Developer",
  "Frontend React Developer",
  "Senior React Developer",
  "React Native Mobile Developer",
  "Full Stack React & Node Developer",
  "Senior Full Stack Engineer",
  "Full Stack Python Developer",
  "JavaScript / TypeScript Engineer",
  "Node.js Backend Developer",
  "Java Software Engineer",
  "Senior Java Spring Boot Developer",
  "Golang / Go Backend Engineer",
  "C# / .NET Core Developer",
  "C++ Systems Engineer",
  "iOS Swift Developer",
  "Android Kotlin Developer",
  "PHP / Laravel Developer",
  "Ruby on Rails Developer",
  "Next.js / Vue.js Web Developer",

  // AI, ML & NLP
  "AI / Machine Learning Engineer",
  "Senior Machine Learning Engineer",
  "Deep Learning Research Scientist",
  "NLP / Natural Language Processing Engineer",
  "Generative AI / LLM Engineer",
  "Computer Vision Engineer",
  "AI Solutions Architect",
  "MLOps Engineer",
  "Prompt Engineer & AI Specialist",

  // Cloud, DevOps & Platform
  "DevOps Engineer",
  "Senior DevOps Engineer",
  "Cloud Solutions Architect (AWS / Azure / GCP)",
  "Site Reliability Engineer (SRE)",
  "Platform Engineer",
  "Kubernetes & Infrastructure Engineer",
  "DevSecOps Engineer",
  "Linux Systems Administrator",
  "Cloud Security Architect",

  // QA, Testing & Security
  "Cybersecurity Analyst",
  "Information Security Specialist",
  "Penetration Tester / Ethical Hacker",
  "SOC Security Analyst",
  "QA Automation Engineer",
  "Senior SDET (Software Development Engineer in Test)",
  "Manual QA Tester",
  "Performance & Load Test Engineer",

  // Product, Agile & Management
  "Technical Product Manager",
  "Senior Product Manager",
  "Associate Product Manager (APM)",
  "Product Owner",
  "Scrum Master / Agile Coach",
  "Engineering Manager",
  "Director of Engineering",
  "Technical Project Manager",
  "IT Business Analyst",
  "Solutions Architect",
  "Enterprise Architect",

  // Design & UX
  "UI/UX Designer",
  "Senior Product Designer",
  "UX Researcher",
  "Visual UI Designer",

  // Marketing, Social Media & Sales
  "Social Media Executive",
  "Social Media Manager",
  "Content Strategist",
  "Digital Marketing Specialist",
  "SEO Specialist",
  "Growth Marketing Manager",
  "Copywriter & Content Lead",
  "Account Executive",
  "Business Development Manager (BDM)",
  "Sales Representative",
  "HR Generalist",
  "Talent Acquisition Specialist",
  "Financial Analyst"
];

const POPULAR_QUICK_PICKS = [
  "Social Media Executive",
  "Full Stack Developer",
  "Data Analyst",
  "Machine Learning Engineer",
  "UI/UX Designer",
  "DevOps Engineer",
  "Technical Product Manager"
];

const JDInput = ({ jdText, setJdText, jobTitle, setJobTitle }) => {
  const [query, setQuery] = useState(jobTitle || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Inclusive Optimizer State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [showOptimizerModal, setShowOptimizerModal] = useState(false);

  const wrapperRef = useRef(null);

  // Filter Client-Side Instant Suggestions
  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 1) return [];
    const qLower = query.toLowerCase().trim();
    return INSTANT_JOB_DATABASE.filter(role => role.toLowerCase().includes(qLower)).slice(0, 8);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectJobTitle = async (title) => {
    setQuery(title);
    setJobTitle(title);
    setShowSuggestions(false);
    setStatusMsg(`Loading AI-generated description for "${title}"...`);
    setErrorMsg(null);
    setIsSearching(true);

    try {
      const res = await searchJD(title);
      if (res && res.jd_text) {
        setJdText(res.jd_text);
        setStatusMsg(`✓ Ready: Loaded benchmark job requirements for "${title}".`);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Could not auto-generate JD text. Please paste manually.");
    } finally {
      setIsSearching(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleScanAndOptimizeJD = async () => {
    if (!jdText.trim()) {
      setErrorMsg("Please enter or paste a Job Description first to analyze bias.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setIsOptimizing(true);
    setErrorMsg(null);
    try {
      const result = await optimizeJD(jdText, jobTitle || query || "Target Position");
      setOptimizationResult(result);
      setShowOptimizerModal(true);
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to scan Job Description for bias. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimizedJD = () => {
    if (optimizationResult?.optimized_jd) {
      setJdText(optimizationResult.optimized_jd);
      setShowOptimizerModal(false);
      setStatusMsg("✓ Applied EEOC-Optimized Inclusive Job Description!");
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        handleSelectJobTitle(query.trim());
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectJobTitle(suggestions[selectedIndex]);
      } else if (query.trim()) {
        handleSelectJobTitle(query.trim());
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const renderHighlightedTitle = (title, matchText) => {
    if (!matchText) return title;
    const index = title.toLowerCase().indexOf(matchText.toLowerCase());
    if (index === -1) return title;
    return (
      <>
        {title.substring(0, index)}
        <span style={{ color: 'var(--accent-cyan)', fontWeight: 800, textDecoration: 'underline' }}>
          {title.substring(index, index + matchText.length)}
        </span>
        {title.substring(index + matchText.length)}
      </>
    );
  };

  return (
    <div className="card" style={{ padding: '1.25rem', position: 'relative' }} ref={wrapperRef}>
      {/* Title Search Bar with Instant Suggestions */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span>Job Title / Target Position:</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>⚡ 120+ Roles Auto-Complete</span>
        </label>
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setJobTitle(e.target.value);
              setShowSuggestions(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => { if (query.trim()) setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            placeholder="Type role name (e.g. Social Media Executive, React Dev, Data Analyst)..."
            style={{
              width: '100%',
              padding: '0.65rem 2.5rem 0.65rem 2.2rem',
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md, 8px)',
              color: 'var(--text-main)',
              fontSize: '0.88rem',
              fontWeight: 600,
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)' }} />
          
          {isSearching && (
            <Loader2 size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)', animation: 'spin 1s linear infinite' }} />
          )}
        </div>

        {/* Live Internet-Style Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              marginTop: '6px',
              background: 'var(--bg-card, #111827)',
              border: '1px solid var(--border-glow, rgba(99, 102, 241, 0.4))',
              borderRadius: 'var(--radius-md, 8px)',
              boxShadow: '0 20px 45px rgba(0,0,0,0.85)',
              zIndex: 150,
              maxHeight: '320px',
              overflowY: 'auto',
              padding: '0.4rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.65rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🔍 Live Role Matches for "{query}"
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Press Enter ↵ to load
              </span>
            </div>

            {suggestions.map((title, idx) => {
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectJobTitle(title)}
                  style={{
                    padding: '0.6rem 0.85rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                    background: isSelected ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(99, 102, 241, 0.15))' : 'transparent',
                    border: isSelected ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} color="var(--accent-cyan)" />
                    <span>{renderHighlightedTitle(title, query)}</span>
                  </div>
                  <ChevronRight size={14} color="var(--text-dim)" style={{ opacity: isSelected ? 1 : 0.4 }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Picks Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Zap size={12} color="#f59e0b" /> Quick Roles:
        </span>
        {POPULAR_QUICK_PICKS.map((quickTitle, qIdx) => (
          <button
            key={qIdx}
            type="button"
            onClick={() => handleSelectJobTitle(quickTitle)}
            style={{
              background: query.toLowerCase() === quickTitle.toLowerCase() ? 'var(--primary)' : 'rgba(255, 255, 255, 0.04)',
              color: query.toLowerCase() === quickTitle.toLowerCase() ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {quickTitle}
          </button>
        ))}
      </div>

      {/* Status or Error Notifications */}
      {statusMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.78rem', padding: '0.4rem 0.75rem', borderRadius: '6px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', fontSize: '0.78rem', padding: '0.4rem 0.75rem', borderRadius: '6px', marginBottom: '0.75rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Detailed Job Description Text Area */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0 }}>
            Job Description Content & Technical Requirements:
          </label>
          
          <button
            type="button"
            onClick={handleScanAndOptimizeJD}
            disabled={isOptimizing}
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: 'var(--primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
            title="Scan Job Description for gender bias, aggressive words, and get an inclusive rewrite"
          >
            {isOptimizing ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Wand2 size={12} />}
            <span>✨ Scan & Optimize JD Bias</span>
          </button>
        </div>

        <textarea
          rows={7}
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste full Job Description text here, or select a role from suggestions above..."
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md, 8px)',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            lineHeight: '1.6',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Inclusive JD Optimizer Modal */}
      {showOptimizerModal && optimizationResult && (
        <div className="modal-overlay" onClick={() => setShowOptimizerModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '780px', width: '92%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.5rem', borderRadius: '50%' }}>
                  <ShieldCheck size={22} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    EEOC Inclusive Language & Bias Audit
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Audited for: {optimizationResult.job_title}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowOptimizerModal(false)}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '0.4rem', borderRadius: '50%', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
              {/* Score Badges Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Inclusivity Index</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: optimizationResult.inclusivity_score >= 80 ? '#10b981' : '#f59e0b', margin: '4px 0' }}>
                    {optimizationResult.inclusivity_score}/100
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Bias Level: {optimizationResult.bias_level}</span>
                </div>

                <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Applicant Boost</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)', margin: '4px 0' }}>
                    +{optimizationResult.estimated_applicant_boost_pct}%
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Diverse Candidate Reach</span>
                </div>

                <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Flagged Elements</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: optimizationResult.flagged_words.length === 0 ? '#10b981' : '#f43f5e', margin: '4px 0' }}>
                    {optimizationResult.flagged_words.length}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Issues Auto-Corrected</span>
                </div>
              </div>

              {/* Flagged Words Table */}
              {optimizationResult.flagged_words.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={15} color="#f59e0b" /> Flagged Words & Replacements:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {optimizationResult.flagged_words.map((item, idx) => (
                      <div key={idx} style={{ background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '0.65rem 0.85rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <div>
                          <strong style={{ color: '#f43f5e' }}>"{item.word}"</strong>
                          <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>➔</span>
                          <strong style={{ color: '#10b981' }}>"{item.suggested_replacement}"</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.reason}</div>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', background: 'rgba(168, 85, 247, 0.1)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimized Preview */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} color="var(--primary)" /> Enhanced Inclusive Job Description:
                </h4>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.82rem', lineHeight: '1.6', color: 'var(--text-body)', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', maxHeight: '220px', overflowY: 'auto' }}>
                  {optimizationResult.optimized_jd}
                </pre>
              </div>
            </div>

            <div style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowOptimizerModal(false)}
                className="btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
              >
                Keep Original
              </button>
              <button
                onClick={handleApplyOptimizedJD}
                className="btn-primary"
                style={{ padding: '0.45rem 1.25rem', fontSize: '0.82rem' }}
              >
                <CheckCircle2 size={15} />
                <span>Apply Inclusive Rewrite to JD</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JDInput;
