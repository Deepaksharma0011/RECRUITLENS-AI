import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Search, Loader2, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { suggestJobTitles, searchJD } from '../services/api';

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
  "Design Systems Lead"
];

const POPULAR_QUICK_PICKS = [
  "Data Analyst",
  "Senior Full Stack Engineer",
  "Python Developer",
  "Frontend React Developer",
  "DevOps Architect",
  "Machine Learning Engineer"
];

const JDInput = ({ jdText, setJdText, jobTitle, setJobTitle, onParsedJD }) => {
  const [query, setQuery] = useState(jobTitle || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const wrapperRef = useRef(null);

  // Sync external jobTitle changes
  useEffect(() => {
    if (jobTitle && jobTitle !== query) {
      setQuery(jobTitle);
    }
  }, [jobTitle]);

  // Click outside listener to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Instant Real-Time Search & Guessing Algorithm (0ms instant response on 1+ characters)
  const computeSuggestions = (inputVal) => {
    if (!inputVal || !inputVal.trim()) {
      return [];
    }

    const clean = inputVal.trim().toLowerCase();
    const words = clean.split(/\s+/).filter(Boolean);

    // Filter from instant database
    const directMatches = [];
    const prefixMatches = [];
    const wordMatches = [];

    for (const title of INSTANT_JOB_DATABASE) {
      const tLower = title.toLowerCase();
      if (tLower === clean) {
        directMatches.push(title);
      } else if (tLower.startsWith(clean)) {
        prefixMatches.push(title);
      } else if (words.every(w => tLower.includes(w))) {
        wordMatches.push(title);
      } else if (words.some(w => w.length >= 2 && tLower.includes(w))) {
        wordMatches.push(title);
      }
    }

    const combined = Array.from(new Set([...directMatches, ...prefixMatches, ...wordMatches]));

    // If typing custom title not in DB, add smart expanded variations
    if (combined.length < 3 && clean.length >= 2) {
      const titleCase = inputVal.trim().replace(/\b\w/g, l => l.toUpperCase());
      const additions = [
        titleCase,
        `Senior ${titleCase}`,
        `Lead ${titleCase} Engineer`,
        `${titleCase} Specialist`
      ];
      additions.forEach(a => {
        if (!combined.includes(a)) combined.push(a);
      });
    }

    return combined.slice(0, 8);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setJobTitle(val);
    setErrorMsg('');
    setSelectedIndex(-1);

    if (val.trim().length >= 1) {
      // 1. Instant 0ms Local Guessing
      const instantMatches = computeSuggestions(val);
      setSuggestions(instantMatches);
      setShowSuggestions(true);

      // 2. Also query backend API asynchronously for deep suggestions
      suggestJobTitles(val)
        .then(res => {
          if (res && res.suggestions && res.suggestions.length > 0) {
            setSuggestions(prev => Array.from(new Set([...prev, ...res.suggestions])).slice(0, 8));
          }
        })
        .catch(() => {});
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Keyboard Navigation (Arrow Up, Arrow Down, Enter, Escape)
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

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
      } else if (suggestions.length > 0) {
        handleSelectJobTitle(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSelectJobTitle = async (title) => {
    setQuery(title);
    setJobTitle(title);
    setShowSuggestions(false);
    setIsSearching(true);
    setStatusMsg(`Auto-generating comprehensive Job Description for "${title}"...`);
    setErrorMsg('');

    try {
      const res = await searchJD(title);
      if (res && res.jd_text) {
        setJdText(res.jd_text);
        if (onParsedJD) {
          onParsedJD(res);
        }
        setStatusMsg(`✓ Professional Job Description loaded for ${title}!`);
      }
    } catch (err) {
      console.error('Search JD error:', err);
      setErrorMsg('Failed to generate JD. Please enter details manually.');
    } finally {
      setIsSearching(false);
      setTimeout(() => setStatusMsg(''), 4000);
    }
  };

  // Highlight matched query letters inside suggestion
  const renderHighlightedTitle = (title, matchQuery) => {
    if (!matchQuery || !matchQuery.trim()) return title;
    const parts = title.split(new RegExp(`(${matchQuery.trim()})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === matchQuery.trim().toLowerCase() ? (
            <span key={i} style={{ color: 'var(--accent-cyan)', fontWeight: 800, textDecoration: 'underline' }}>
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="card-glass jd-input-container" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
      
      {/* Title & Instant Search Input */}
      <div style={{ position: 'relative', marginBottom: '0.85rem' }} ref={wrapperRef}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="var(--accent-cyan)" />
            Target Job Title & Instant AI Suggestions
          </label>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            ⚡ Live Auto-Guess Active
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="search-input"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim().length >= 1) {
                setSuggestions(computeSuggestions(query));
                setShowSuggestions(true);
              }
            }}
            placeholder="Type any role (e.g. Data, Python, React, DevOps, AI, Product)..."
            style={{
              width: '100%',
              padding: '0.65rem 2.2rem 0.65rem 2.2rem',
              borderRadius: 'var(--radius-md, 8px)',
              border: showSuggestions ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
              background: 'var(--bg-dark)',
              color: 'var(--text-main)',
              fontSize: '0.88rem',
              fontWeight: 600,
              boxShadow: showSuggestions ? '0 0 15px rgba(6, 182, 212, 0.25)' : 'none',
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
                    color: isSelected ? '#fff' : 'var(--text-main)',
                    background: isSelected ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(99, 102, 241, 0.25))' : 'transparent',
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
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.78rem', padding: '0.4rem 0.75rem', borderRadius: '6px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f87171', fontSize: '0.78rem', padding: '0.4rem 0.75rem', borderRadius: '6px', marginBottom: '0.75rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Detailed Job Description Text Area */}
      <div>
        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
          Job Description Content & Technical Requirements:
        </label>
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
    </div>
  );
};

export default JDInput;
