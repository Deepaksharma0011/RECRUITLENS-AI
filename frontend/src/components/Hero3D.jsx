import React, { useEffect, useRef } from 'react';
import { Sparkles, ShieldCheck, Cpu, Zap, Target, Layers, ArrowUpRight, Compass } from 'lucide-react';

const Hero3D = ({ onSampleClick }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // 3D Nodes representation of Semantic Vectors & Skills
    const NODE_COUNT = 32;
    const nodes = [];
    const radius = Math.min(width, height) * 0.35;

    for (let i = 0; i < NODE_COUNT; i++) {
      // Fibonacci sphere distribution for uniform 3D sphere
      const phi = Math.acos(-1 + (2 * i) / NODE_COUNT);
      const theta = Math.sqrt(NODE_COUNT * Math.PI) * phi;

      nodes.push({
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
        origRadius: radius,
        baseColor: i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#6366f1' : '#10b981',
        label: ['Python', 'FastAPI', 'React', 'Embeddings', 'NLP', 'Docker', 'AWS', 'PyTorch', 'Vector 768D', 'Bias Shield', 'Cosine Sim', 'K8s', 'SQL', 'LLM'][i % 14]
      });
    }

    let rotX = 0;
    let rotY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - width / 2;
      const y = e.clientY - rect.top - height / 2;
      mouseX = (x / width) * 0.002;
      mouseY = (y / height) * 0.002;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let angleX = 0.004;
    let angleY = 0.006;
    let scanLineY = -height / 2;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Update rotation
      rotX += angleX + mouseY;
      rotY += angleY + mouseX;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // Transform 3D to 2D perspective
      const projectedNodes = nodes.map(node => {
        // Rotate around Y
        let x1 = node.x * cosY - node.z * sinY;
        let z1 = node.z * cosY + node.x * sinY;

        // Rotate around X
        let y2 = node.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + node.y * sinX;

        // Perspective projection
        const focalLength = 320;
        const scale = focalLength / (focalLength + z2 + 300);
        const px = centerX + x1 * scale;
        const py = centerY + y2 * scale;

        return {
          px,
          py,
          scale,
          z: z2,
          color: node.baseColor,
          label: node.label
        };
      });

      // Sort by Z depth for realistic rendering
      projectedNodes.sort((a, b) => b.z - a.z);

      // Draw connecting 3D neural vector lines
      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const p1 = projectedNodes[i];
          const p2 = projectedNodes[j];
          const dist = Math.hypot(p1.px - p2.px, p1.py - p2.py);

          if (dist < 90) {
            const alpha = (1 - dist / 90) * 0.25 * Math.min(p1.scale, p2.scale);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 1 * p1.scale;
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          }
        }
      }

      // Draw 3D scanning ring
      scanLineY += 1.5;
      if (scanLineY > height / 2 + 100) scanLineY = -height / 2 - 100;

      const grad = ctx.createLinearGradient(0, centerY + scanLineY - 30, 0, centerY + scanLineY + 30);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0)');
      grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.15)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, centerY + scanLineY - 30, width, 60);

      // Draw 3D Nodes
      projectedNodes.forEach(node => {
        const radius = Math.max(2, 4 * node.scale);
        const alpha = Math.max(0.2, Math.min(1, (node.z + 200) / 400));

        // Node Outer Glow
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `${node.color}22`;
        ctx.fill();

        // Node Inner Core
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 10 * node.scale;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label for closer nodes
        if (node.scale > 0.85) {
          ctx.font = `600 ${Math.round(10 * node.scale)}px 'Plus Jakarta Sans', sans-serif`;
          ctx.fillStyle = `rgba(241, 245, 249, ${alpha * 0.8})`;
          ctx.fillText(node.label, node.px + radius + 4, node.py + 3);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="hero-3d-wrapper">
      {/* 3D Holographic Canvas Background Layer */}
      <canvas ref={canvasRef} className="hero-3d-canvas" />

      {/* Foreground Hero Content with 3D Depth */}
      <div className="hero-3d-content">
        <div className="hero-left">
          <div className="hero-badge-pill">
            <span className="hero-pulse-dot"></span>
            <Sparkles size={13} color="var(--accent-cyan)" />
            <span>Next-Gen 3D Semantic Talent Intelligence</span>
          </div>

          <h1 className="hero-3d-title">
            Unbiased AI Candidate Screening & Matching
          </h1>

          <p className="hero-3d-subtitle">
            Harness high-dimensional sentence transformer embeddings, automated demographic bias redaction, and GPT-4 explainable scorecards to find your ideal engineers in seconds.
          </p>

          <div className="hero-stats-row">
            <div className="hero-stat-box">
              <span className="hero-stat-value">100%</span>
              <span className="hero-stat-label">Demographic Blind</span>
            </div>
            <div className="hero-stat-box">
              <span className="hero-stat-value">768-D</span>
              <span className="hero-stat-label">Semantic Embeddings</span>
            </div>
            <div className="hero-stat-box">
              <span className="hero-stat-value">&lt;1.2s</span>
              <span className="hero-stat-label">Batch Evaluation</span>
            </div>
            <div className="hero-stat-box">
              <span className="hero-stat-value">30-60-90</span>
              <span className="hero-stat-label">Ramp-Up Roadmaps</span>
            </div>
          </div>
        </div>

        {/* Floating 3D Hologram Cards */}
        <div className="hero-right-cards">
          <div className="floating-card card-1">
            <div className="floating-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>EEOC Fair Hiring Guard</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Names, gender & prestige scrubbed</p>
            </div>
          </div>

          <div className="floating-card card-2">
            <div className="floating-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <Cpu size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>MiniLM-L6 Vector Engine</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Deep contextual similarity match</p>
            </div>
          </div>

          <div className="floating-card card-3">
            <div className="floating-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
              <Target size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Tailored Rubric Scorecards</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>1-5 rating criteria & questions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero3D;
