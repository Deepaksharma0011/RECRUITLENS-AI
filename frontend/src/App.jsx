import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Hero3D from './components/Hero3D';
import ResumeUploader from './components/ResumeUploader';
import JDInput from './components/JDInput';
import CandidateList from './components/CandidateList';
import CandidateDetailModal from './components/CandidateDetailModal';
import CandidateCompareModal from './components/CandidateCompareModal';
import ResumeSplitViewer from './components/ResumeSplitViewer';
import EEOCAuditModal from './components/EEOCAuditModal';
import KnockoutFilterModal from './components/KnockoutFilterModal';
import AnalyticsSummary from './components/AnalyticsSummary';
import WeightSliders from './components/WeightSliders';
import { uploadResumes, parseJD, scoreCandidates, resetSession, getResults, updateCandidateStatus } from './services/api';
import { Play, Sparkles, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import './App.css';

function App() {
  const [backendConnected, setBackendConnected] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [parsedCandidates, setParsedCandidates] = useState([]);
  const [jdText, setJdText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jdSkills, setJdSkills] = useState([]);
  
  const [rawRankedCandidates, setRawRankedCandidates] = useState([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [splitViewerCandidate, setSplitViewerCandidate] = useState(null);
  const [isEEOCAuditOpen, setIsEEOCAuditOpen] = useState(false);
  const [isKnockoutModalOpen, setIsKnockoutModalOpen] = useState(false);
  const [isFullWidthATS, setIsFullWidthATS] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Enterprise Features State
  const [blindMode, setBlindMode] = useState(true);
  const [semanticWeight, setSemanticWeight] = useState(60);
  const [skillWeight, setSkillWeight] = useState(40);
  const [minScoreFilter, setMinScoreFilter] = useState(0);

  const [selectedCompareIds, setSelectedCompareIds] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Knockout Configuration
  const [knockoutConfig, setKnockoutConfig] = useState({
    active: false,
    minExp: 0,
    minScore: 0,
    mandatorySkills: [],
    hideKnockedOut: false
  });

  // Check Backend Connection on Mount
  useEffect(() => {
    getResults()
      .then(() => setBackendConnected(true))
      .catch(() => setBackendConnected(false));
  }, []);

  // Sync theme class to body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    } else {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  // Dynamic Re-ranking Engine based on Slider Weights
  const displayedCandidates = useMemo(() => {
    if (!rawRankedCandidates || rawRankedCandidates.length === 0) return [];

    const totalWeight = (semanticWeight + skillWeight) || 100;
    const normSemanticW = semanticWeight / totalWeight;
    const normSkillW = skillWeight / totalWeight;

    const reCalculated = rawRankedCandidates.map(cand => {
      const semPct = (cand.semantic_similarity || 0) * 100.0;
      const skillPct = cand.skill_match_percentage || 0;
      
      let composite = (semPct * normSemanticW) + (skillPct * normSkillW);
      composite = roundScore(Math.max(10.0, Math.min(99.0, composite)));

      return {
        ...cand,
        score: composite
      };
    });

    return reCalculated
      .filter(c => c.score >= minScoreFilter)
      .sort((a, b) => b.score - a.score)
      .map((cand, idx) => ({ ...cand, display_rank: idx + 1 }));
  }, [rawRankedCandidates, semanticWeight, skillWeight, minScoreFilter]);

  function roundScore(val) {
    return Math.round(val * 10) / 10;
  }

  // Helper to deduplicate files array
  const deduplicateFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return [];
    const unique = [];
    const seen = new Set();
    for (const f of fileList) {
      const key = `${f.name}_${f.size}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(f);
      }
    }
    return unique;
  };

  // Handle uploading candidate resume files
  const handleFilesSelected = async (files) => {
    const uniqueFiles = deduplicateFiles(files);
    setSelectedFiles(uniqueFiles);
    setRawRankedCandidates([]);
    setSelectedCompareIds([]);
    setErrorMsg(null);
    try {
      const parsed = await uploadResumes(uniqueFiles);
      setParsedCandidates(parsed);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to upload or parse resume files.");
    }
  };

  // Quick 1-Click Load Sample Candidate Resumes
  const handleLoadSampleResumes = async () => {
    setRawRankedCandidates([]);
    setSelectedCompareIds([]);
    setErrorMsg(null);
    
    const cand1Text = `ALEXANDER R. MORGAN
Email: alex.morgan@gmail.com | Phone: (555) 234-5678 | Address: San Francisco, CA
LinkedIn: linkedin.com/in/alexmorgan-tech | Gender: Male | Age: 32

SUMMARY:
Senior Full Stack Engineer with 6 years of experience building cloud microservices, web platforms, and data pipelines using Python, FastAPI, React, TypeScript, Docker, and AWS.

SKILLS:
Python, JavaScript, TypeScript, FastAPI, React, React.js, Node.js, PostgreSQL, Docker, Kubernetes, AWS, REST API, System Design, Git, CI/CD, Agile.

WORK EXPERIENCE:
Senior Software Engineer — TechCorp Inc (2021 – Present)
• Built scalable FastAPI backend microservices handling 2M requests daily.
• Developed interactive frontend analytics dashboards using React, Redux, and Tailwind CSS.
• Deployed dockerized application containers to AWS EKS with Terraform and Github Actions.

Full Stack Software Engineer — DataFlow Systems (2018 – 2021)
• Architected PostgreSQL database schemas and optimized slow SQL queries by 40%.
• Built RESTful API integration layers using Python, Node.js, and Redis caching.

EDUCATION:
B.S. in Computer Science — Stanford University (2014 – 2018)`;

    const cand2Text = `PRIYA SHARMA
Email: priya.sharma@domain.io | Phone: +1 415-987-6543 | Location: Seattle, WA
Female | Age: 29 | Photo: photo_profile.jpg

SUMMARY:
AI/ML Specialist & Data Scientist with 4 years of experience specializing in NLP, transformers, machine learning models, PyTorch, Python, and data engineering.

SKILLS:
Python, PyTorch, Machine Learning, Deep Learning, NLP, Natural Language Processing, Scikit-Learn, Pandas, NumPy, SQL, FastAPI, Docker, Git, Data Analysis.

EXPERIENCE:
Machine Learning Engineer — AI Labs (2022 – Present)
• Trained transformer sentence embedding models for semantic document retrieval.
• Developed automated NLP text extraction and entity recognition pipelines in Python.

Data Scientist — Analytics Solutions (2020 – 2022)
• Built predictive classification models using Scikit-Learn and Pandas.

EDUCATION:
M.S. in Data Science — Carnegie Mellon University (2018 – 2020)`;

    const cand3Text = `JORDAN BENNETT
Email: jordan.b@outlook.com | Phone: (555) 876-5432
Address: Austin, TX | Male | DOB: 12/04/1994

SUMMARY:
Frontend Engineer & Web Developer with 3 years of experience focused on React, Vue.js, JavaScript, HTML, CSS, and UI component design.

SKILLS:
JavaScript, React, Vue.js, HTML, CSS, Bootstrap, Git, Figma, Web Development.

EXPERIENCE:
Frontend Developer — Creative Studio (2022 – Present)
• Built responsive client websites and UI components using React and Vue.js.

EDUCATION:
B.A. in Graphic Design — State College (2016 – 2020)`;

    const file1 = new File([cand1Text], "Resume_Alexander_Morgan_FullStack.txt", { type: "text/plain" });
    const file2 = new File([cand2Text], "Resume_Priya_Sharma_AIML.txt", { type: "text/plain" });
    const file3 = new File([cand3Text], "Resume_Jordan_Bennett_Frontend.txt", { type: "text/plain" });

    const sampleFiles = [file1, file2, file3];
    setSelectedFiles(sampleFiles);

    if (!jdText || !jdText.trim()) {
      setJobTitle("Senior Full Stack Engineer");
      setJdText(`Job Title: Senior Full Stack Engineer
Experience: 4+ Years

Role Overview:
We are looking for a Senior Full Stack Engineer to lead backend microservices and modern React frontend web applications.

Required Technical Skills:
• Python, FastAPI, JavaScript, TypeScript, React (React.js), PostgreSQL, Docker, AWS, REST API, System Design, Git, CI/CD, Agile methodology.`);
    }

    try {
      const parsed = await uploadResumes(sampleFiles);
      setParsedCandidates(parsed);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to upload sample resumes.");
    }
  };

  // Main evaluation trigger
  const handleEvaluatePipeline = async () => {
    setErrorMsg(null);
    if (!parsedCandidates || parsedCandidates.length === 0) {
      setErrorMsg("Please upload candidate resumes or click 'Load 3 Sample Resumes' first.");
      return;
    }
    if (!jdText || !jdText.trim()) {
      setErrorMsg("Please enter or select a Job Description text.");
      return;
    }

    setIsEvaluating(true);
    try {
      let activeParsed = parsedCandidates;

      if (selectedFiles && selectedFiles.length > 0) {
        const uniqueFiles = deduplicateFiles(selectedFiles);
        activeParsed = await uploadResumes(uniqueFiles);
        setParsedCandidates(activeParsed);
      }

      const jdRes = await parseJD(jdText, jobTitle);
      setJdSkills(jdRes.required_skills);

      const scoresRes = await scoreCandidates();
      
      // Strict candidate matching filter against activeParsed
      const validCandidateIds = new Set((activeParsed || []).map(c => c.candidate_id));
      const filteredScores = scoresRes.filter(c => validCandidateIds.has(c.candidate_id));

      setRawRankedCandidates(filteredScores.length > 0 ? filteredScores : scoresRes);
      setBackendConnected(true);

      if (scoresRes.length > 0 && scoresRes[0].score >= 75) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Evaluation failed. Make sure backend FastAPI server is running.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Reset current session
  const handleResetSession = async () => {
    try {
      await resetSession();
    } catch (e) {}
    setSelectedFiles([]);
    setParsedCandidates([]);
    setJdText('');
    setRawRankedCandidates([]);
    setSelectedCandidate(null);
    setSplitViewerCandidate(null);
    setSelectedCompareIds([]);
    setErrorMsg(null);
  };

  // Candidate Status & Stage Updates
  const handleUpdateCandidateStage = (candidateId, newStage) => {
    setRawRankedCandidates(prev => prev.map(c => c.candidate_id === candidateId ? { ...c, stage: newStage } : c));
    updateCandidateStatus(candidateId, { stage: newStage });
  };

  const handleUpdateCandidateRating = (candidateId, newRating) => {
    setRawRankedCandidates(prev => prev.map(c => c.candidate_id === candidateId ? { ...c, rating: newRating } : c));
    updateCandidateStatus(candidateId, { rating: newRating });
  };

  const handleUpdateCandidate = (updatedCand) => {
    setRawRankedCandidates(prev => prev.map(c => c.candidate_id === updatedCand.candidate_id ? updatedCand : c));
    setSelectedCandidate(updatedCand);
  };

  // Multi-Candidate Compare Selection Toggle
  const handleToggleCompare = (candId) => {
    if (selectedCompareIds.includes(candId)) {
      setSelectedCompareIds(selectedCompareIds.filter(id => id !== candId));
    } else {
      if (selectedCompareIds.length >= 3) {
        alert("You can compare up to 3 candidates head-to-head.");
        return;
      }
      setSelectedCompareIds([...selectedCompareIds, candId]);
    }
  };

  // Export Candidate Scorecard CSV
  const handleExportCSV = () => {
    if (!displayedCandidates || displayedCandidates.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Rank,Candidate Name,Stage,Match Score (/100),Semantic Relevance (%),Skill Match (%),Matched Skills,Missing Skills,Integrity Score\n";

    displayedCandidates.forEach((c, idx) => {
      const name = blindMode ? `Candidate #${idx + 1}` : `"${c.candidate_name}"`;
      const stage = `"${c.stage || 'Screened'}"`;
      const matched = `"${(c.matched_skills || []).join('; ')}"`;
      const missing = `"${(c.missing_skills || []).join('; ')}"`;
      const semPct = ((c.semantic_similarity || 0) * 100).toFixed(0);
      const integrity = c.integrity_score || 100;

      csvContent += `${idx + 1},${name},${stage},${c.score},${semPct}%,${c.skill_match_percentage}%,${matched},${missing},${integrity}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RecruitLens_Candidate_Report_${jobTitle.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Executive PDF Report
  const handlePrintPDF = () => {
    window.print();
  };

  const comparedCandidates = displayedCandidates.filter(c => selectedCompareIds.includes(c.candidate_id));

  return (
    <div className={`app-root ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <Header
        onReset={handleResetSession}
        backendConnected={backendConnected}
        blindMode={blindMode}
        setBlindMode={setBlindMode}
        hasCandidates={displayedCandidates.length > 0}
        onExportCSV={handleExportCSV}
        onPrintPDF={handlePrintPDF}
        onOpenEEOCAudit={() => setIsEEOCAuditOpen(true)}
        theme={theme}
        setTheme={setTheme}
      />

      <main className="app-container">
        {/* Interactive 3D Holographic Hero Banner */}
        <Hero3D onSampleClick={handleLoadSampleResumes} />

        {/* Banner Alert for Error */}
        {errorMsg && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#f87171', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={20} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} style={{ background: 'transparent', color: '#f87171', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* Analytics Summary when scores ready */}
        {displayedCandidates.length > 0 && (
          <AnalyticsSummary
            candidates={displayedCandidates}
            jobTitle={jobTitle}
            jdSkillsCount={jdSkills.length}
            allJdSkills={jdSkills}
          />
        )}

        {/* Interactive Dynamic Weighting Sliders */}
        {rawRankedCandidates.length > 0 && (
          <WeightSliders
            semanticWeight={semanticWeight}
            setSemanticWeight={setSemanticWeight}
            skillWeight={skillWeight}
            setSkillWeight={setSkillWeight}
            minScoreFilter={minScoreFilter}
            setMinScoreFilter={setMinScoreFilter}
            onResetWeights={() => {
              setSemanticWeight(60);
              setSkillWeight(40);
              setMinScoreFilter(0);
            }}
          />
        )}

        <div className={`dashboard-grid ${isFullWidthATS ? 'full-width-ats' : ''}`}>
          {/* Left Column: Uploads & JD Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Screening Setup
              </span>
              <button
                className="btn-secondary"
                onClick={handleLoadSampleResumes}
                style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: 'rgba(6, 182, 212, 0.3)', color: 'var(--accent-cyan)' }}
              >
                <Sparkles size={14} />
                <span>Load 3 Sample Resumes</span>
              </button>
            </div>

            <ResumeUploader
              files={selectedFiles}
              parsedCount={parsedCandidates.length}
              onFilesSelected={handleFilesSelected}
            />

            <JDInput
              jdText={jdText}
              setJdText={setJdText}
              jobTitle={jobTitle}
              setJobTitle={setJobTitle}
            />

            <div style={{ marginTop: '1.5rem' }}>
              <button
                className="btn-primary"
                onClick={handleEvaluatePipeline}
                disabled={isEvaluating}
              >
                {isEvaluating ? (
                  <>
                    <div style={{ width: '18px', height: '18px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <span>Computing Embeddings & Scoring...</span>
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    <span>Evaluate & Rank Candidates</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Ranked Results */}
          <div>
            <CandidateList
              candidates={displayedCandidates}
              jobTitle={jobTitle}
              onSelectCandidate={(cand) => setSelectedCandidate(cand)}
              onOpenSplitViewer={(cand) => setSplitViewerCandidate(cand)}
              isLoading={isEvaluating}
              blindMode={blindMode}
              selectedCompareIds={selectedCompareIds}
              onToggleCompare={handleToggleCompare}
              onOpenCompare={() => setIsCompareOpen(true)}
              onOpenKnockoutModal={() => setIsKnockoutModalOpen(true)}
              knockoutConfig={knockoutConfig}
              onUpdateCandidateStage={handleUpdateCandidateStage}
              onUpdateCandidateRating={handleUpdateCandidateRating}
              isFullWidth={isFullWidthATS}
              onToggleFullWidth={() => setIsFullWidthATS(prev => !prev)}
            />
          </div>
        </div>
      </main>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          blindMode={blindMode}
          onUpdateCandidate={handleUpdateCandidate}
          onOpenSplitViewer={(c) => {
            setSelectedCandidate(null);
            setSplitViewerCandidate(c);
          }}
        />
      )}

      {/* Interactive Split-Screen Resume Viewer */}
      {splitViewerCandidate && (
        <ResumeSplitViewer
          candidate={splitViewerCandidate}
          jdSkills={jdSkills}
          onClose={() => setSplitViewerCandidate(null)}
          blindMode={blindMode}
        />
      )}

      {/* Side-by-Side Candidate Compare Matrix Modal */}
      {isCompareOpen && (
        <CandidateCompareModal
          candidates={comparedCandidates}
          onClose={() => setIsCompareOpen(false)}
          blindMode={blindMode}
        />
      )}

      {/* EEOC Compliance Audit Certificate Modal */}
      {isEEOCAuditOpen && (
        <EEOCAuditModal
          totalEvaluated={displayedCandidates.length}
          jobTitle={jobTitle}
          onClose={() => setIsEEOCAuditOpen(false)}
        />
      )}

      {/* Hard Filters & Knockout Criteria Modal */}
      {isKnockoutModalOpen && (
        <KnockoutFilterModal
          allJdSkills={jdSkills}
          knockoutConfig={knockoutConfig}
          setKnockoutConfig={setKnockoutConfig}
          onClose={() => setIsKnockoutModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
