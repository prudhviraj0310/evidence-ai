import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  Shield, ArrowRight, Play, CheckCircle2, AlertTriangle,
  Gavel, Layers, Cloud, Cpu, Database, FileText, ChevronRight,
  ChevronLeft, Sparkles, Scale, Lock, RefreshCw, Key
} from 'lucide-react';
import { useCase } from '../context/CaseContext';

const SLIDES = [
  { id: 'hero', navLabel: 'CRIME' },
  { id: 'why', navLabel: 'WHY THIS PROJECT' },
  { id: 'effective', navLabel: 'HOW IT IS EFFECTIVE' },
  { id: 'aws', navLabel: 'AWS INTEGRATION' },
  { id: 'workflow', navLabel: 'CASE WORKFLOW' },
];

export default function LandingPage({ onStart }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideRef = useRef(null);
  const polaroidRef = useRef(null);
  const { loadDemoCase, solve, evidence, verdict, loading } = useCase();
  const [activeStep, setActiveStep] = useState(1);

  // GSAP animation on slide change
  useEffect(() => {
    if (slideRef.current) {
      gsap.fromTo(
        slideRef.current.children,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [currentSlide]);

  // Subtle floating animation on polaroid
  useEffect(() => {
    if (polaroidRef.current) {
      gsap.to(polaroidRef.current, {
        y: -6,
        rotation: -1,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
  }, []);

  // Keyboard arrow keys for PPT-style presentation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentSlide((prev) => Math.min(prev + 1, SLIDES.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickIngest = async () => {
    await loadDemoCase({ stage: 'initial' });
    setActiveStep(2);
  };

  const handleQuickSolve = async () => {
    await solve();
    setActiveStep(3);
    setTimeout(() => {
      onStart();
    }, 1200);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070709',
      color: '#FFFFFF',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      userSelect: 'none',
    }}>
      {/* ── Scratched Film & Texture Overlay ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          radial-gradient(ellipse at 80% 20%, rgba(185, 28, 28, 0.15) 0%, transparent 60%),
          radial-gradient(ellipse at 20% 80%, rgba(139, 0, 0, 0.2) 0%, transparent 50%),
          repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(255,255,255,0.01) 100px, rgba(255,255,255,0.01) 101px)
        `,
        opacity: 0.9,
        zIndex: 1,
      }} />

      {/* ── Blood Splatter Graphic Accent (Bottom Left) ── */}
      <div style={{
        position: 'absolute', bottom: -30, left: -30, width: 260, height: 260,
        pointerEvents: 'none', zIndex: 2, opacity: 0.75,
      }}>
        <svg viewBox="0 0 200 200" fill="#B31E1E">
          <path d="M40,160 C20,140 10,170 30,190 C60,200 90,170 70,140 C50,120 10,130 40,160 Z" />
          <path d="M70,120 C90,80 130,110 110,140 C90,170 50,150 70,120 Z" />
          <circle cx="130" cy="150" r="14" />
          <circle cx="150" cy="120" r="7" />
          <circle cx="95" cy="80" r="9" />
          <circle cx="165" cy="165" r="5" />
          <circle cx="35" cy="100" r="6" />
          <path d="M20,180 L140,90 L90,140 Z" opacity="0.6" />
        </svg>
      </div>

      {/* ── TOP NAV BAR (Exact Template Alignment) ── */}
      <header style={{
        position: 'relative', zIndex: 20,
        padding: '24px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setCurrentSlide(0)}>
          <span style={{
            fontSize: 20, fontWeight: 900,
            fontFamily: "'IBM Plex Serif', Georgia, serif",
            letterSpacing: '0.08em', color: '#FFFFFF',
          }}>
            EVIDENCE
          </span>
          <span style={{
            fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 800, padding: '2px 6px', borderRadius: 2,
            background: '#B31E1E', color: '#FFF', letterSpacing: '0.15em',
          }}>
            AI TRUTH VERIFICATION
          </span>
        </div>

        {/* Presentation Slide Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {SLIDES.map((slide, idx) => {
            const isActive = currentSlide === idx;
            return (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  background: 'none', border: 'none',
                  fontSize: 12, fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.14em',
                  color: isActive ? '#E52525' : '#8E8E93',
                  cursor: 'pointer',
                  position: 'relative',
                  paddingBottom: 4,
                  transition: 'color 0.2s',
                }}
              >
                {slide.navLabel}
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: 2, background: '#E52525',
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Enter Investigation Button */}
        <button
          onClick={onStart}
          style={{
            background: '#E52525',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 22px',
            borderRadius: 2,
            fontSize: 11,
            fontWeight: 900,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(229, 37, 37, 0.4)',
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'transform 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.background = '#FF2A2A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#E52525'; }}
        >
          <span>CRIME SCENE</span>
          <ArrowRight size={14} />
        </button>
      </header>

      {/* ── MAIN CONTENT AREA (SLIDE CONTAINER) ── */}
      <main style={{
        position: 'relative', zIndex: 10,
        flex: 1, display: 'flex', alignItems: 'center',
        padding: '0 48px', maxWidth: 1440, width: '100%', margin: '0 auto',
      }}>
        <div ref={slideRef} style={{ width: '100%' }}>

          {/* ═════════════════════════════════════════════
              SLIDE 0: WHAT THE THING IS & HERO (Exact Poster Match)
              ═════════════════════════════════════════════ */}
          {currentSlide === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'center' }}>
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 900,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#E52525', letterSpacing: '0.25em',
                  textTransform: 'uppercase', marginBottom: 8,
                }}>
                  ● FORENSIC INTELLIGENCE DOSSIER // CASE-001
                </div>

                {/* Giant typography from reference image */}
                <h1 style={{
                  fontSize: 'clamp(56px, 7vw, 96px)',
                  fontWeight: 900,
                  lineHeight: 0.9,
                  letterSpacing: '-0.03em',
                  fontFamily: "'Inter', sans-serif",
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}>
                  CRIME
                </h1>
                <h2 style={{
                  fontSize: 'clamp(36px, 5vw, 68px)',
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: '0.04em',
                  fontFamily: "'Inter', sans-serif",
                  color: '#E52525',
                  textTransform: 'uppercase',
                  marginBottom: 20,
                }}>
                  INVESTIGATION
                </h2>

                <p style={{
                  fontSize: 15,
                  color: '#CCCCCC',
                  lineHeight: 1.65,
                  maxWidth: 540,
                  fontFamily: "'Inter', sans-serif",
                  marginBottom: 28,
                }}>
                  <strong>EVIDENCE</strong> is an autonomous forensic AI platform that converts chaotic police files, CCTV footage, audio taps, and keycard logs into an undeniable, mathematically deterministic proof of guilt. It detects fabricated alibis and convicts with 100% auditable provenance.
                </p>

                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 32 }}>
                  <button
                    onClick={onStart}
                    style={{
                      background: '#E52525',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '14px 32px',
                      borderRadius: 2,
                      fontSize: 13,
                      fontWeight: 900,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: '0 6px 24px rgba(229, 37, 37, 0.45)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <span>ENTER CRIME SCENE</span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    onClick={() => setCurrentSlide(1)}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      color: '#E5E5EA',
                      border: '1px solid rgba(255,255,255,0.2)',
                      padding: '14px 24px',
                      borderRadius: 2,
                      fontSize: 12,
                      fontWeight: 800,
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '0.12em',
                      cursor: 'pointer',
                    }}
                  >
                    PITCH DECK →
                  </button>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  color: '#666666', letterSpacing: '0.2em', textTransform: 'uppercase',
                }}>
                  <span style={{ color: '#E52525' }}>● ● ●</span>
                  <span>#INVESTIGATION</span>
                  <span>·</span>
                  <span>BLACKWOOD_MANOR</span>
                  <span>·</span>
                  <span>AWS_STEP_FUNCTIONS</span>
                </div>
              </div>

              {/* ── Pinned Polaroid Photo (Exact visual match from reference image) ── */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                  ref={polaroidRef}
                  style={{
                    background: '#FFFFFF',
                    padding: '16px 16px 40px 16px',
                    borderRadius: 2,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 30px rgba(179, 30, 30, 0.3)',
                    position: 'relative',
                    width: '100%',
                    maxWidth: 480,
                    transform: 'rotate(1deg)',
                  }}
                >
                  {/* Top-Right Silver Metallic Push Pin */}
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #FFFFFF, #B0B0B0 50%, #4A4A4A 100%)',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.6), inset 0 1px 2px #FFF',
                    zIndex: 10,
                  }} />

                  {/* Bottom-Left Silver Metallic Push Pin */}
                  <div style={{
                    position: 'absolute', bottom: 8, left: 8,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #FFFFFF, #B0B0B0 50%, #4A4A4A 100%)',
                    boxShadow: '0 3px 6px rgba(0,0,0,0.6), inset 0 1px 2px #FFF',
                    zIndex: 10,
                  }} />

                  {/* High Contrast Crime Scene Image */}
                  <div style={{
                    width: '100%', height: 320,
                    overflow: 'hidden',
                    background: '#8B0000',
                    position: 'relative',
                  }}>
                    <img
                      src="/crime_scene_hero.jpg"
                      alt="Crime Scene Evidence"
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        filter: 'contrast(1.2) brightness(0.9)',
                      }}
                    />
                    {/* Inner Polaroid vignette */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)',
                      pointerEvents: 'none',
                    }} />
                  </div>

                  {/* Handwritten Polaroid Caption */}
                  <div style={{
                    marginTop: 12,
                    fontFamily: "'Caveat', cursive",
                    fontSize: 20, fontWeight: 700,
                    color: '#1A140E',
                    textAlign: 'center',
                    letterSpacing: '0.02em',
                  }}>
                    Crime Scene #01: Blackwood Manor — 02:44 AM
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════
              SLIDE 1: WHY WE CHOSE THIS PROJECT (The Problem)
              ═════════════════════════════════════════════ */}
          {currentSlide === 1 && (
            <div style={{ maxWidth: 1080, margin: '0 auto' }}>
              <div style={{
                fontSize: 11, fontWeight: 900,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#E52525', letterSpacing: '0.25em',
                textTransform: 'uppercase', marginBottom: 8,
              }}>
                PITCH PILLAR 01 // PROBLEM STATEMENT
              </div>
              <h2 style={{
                fontSize: 48, fontWeight: 900,
                fontFamily: "'Inter', sans-serif",
                color: '#FFFFFF', marginBottom: 16,
              }}>
                Why We Chose <span style={{ color: '#E52525' }}>This Project</span>
              </h2>
              <p style={{
                fontSize: 16, color: '#A0A0A5', maxWidth: 780, lineHeight: 1.6, marginBottom: 36,
              }}>
                In real-world homicide trials and forensic investigations, human cognitive overload and generative AI hallucinations are catastrophic failures.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 36 }}>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: 26, borderRadius: 2,
                }}>
                  <div style={{ width: 38, height: 38, background: '#B31E1E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <AlertTriangle size={20} color="#FFF" />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Cognitive Overload</h3>
                  <p style={{ fontSize: 13, color: '#8E8E93', lineHeight: 1.6 }}>
                    A single felony case contains 500+ pages of wiretaps, hours of CCTV, keycard badge logs, and forensic coroner notes. Critical timeline contradictions are frequently missed by exhausted detectives.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: 26, borderRadius: 2,
                }}>
                  <div style={{ width: 38, height: 38, background: '#B31E1E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Cpu size={20} color="#FFF" />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>LLMs Hallucinate Guilt</h3>
                  <p style={{ fontSize: 13, color: '#8E8E93', lineHeight: 1.6 }}>
                    Standard LLMs cannot be trusted in criminal justice because they invent facts, jump to biased conclusions, and fabricate quotes. Innocent people could be sentenced based on statistical text prediction.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: 26, borderRadius: 2,
                }}>
                  <div style={{ width: 38, height: 38, background: '#B31E1E', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Scale size={20} color="#FFF" />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Unchecked Alibis</h3>
                  <p style={{ fontSize: 13, color: '#8E8E93', lineHeight: 1.6 }}>
                    Criminal conspiracies deliberately plant conflicting alibis across multiple actors. Without automated cross-correlation, contradictions remain invisible until court cross-examination breaks the state's case.
                  </p>
                </div>
              </div>

              <div style={{
                padding: '16px 24px', borderRadius: 2,
                background: 'rgba(229, 37, 37, 0.1)',
                border: '1px solid #E52525',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#FFF' }}>
                  OUR MISSION: Strict separation of powers — AI extracts the claims, deterministic math delivers the verdict.
                </span>
                <button
                  onClick={() => setCurrentSlide(2)}
                  style={{
                    background: '#E52525', color: '#FFF', border: 'none',
                    padding: '8px 18px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  HOW IT WORKS →
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════
              SLIDE 2: HOW IT IS EFFECTIVE (The Secret Sauce)
              ═════════════════════════════════════════════ */}
          {currentSlide === 2 && (
            <div style={{ maxWidth: 1080, margin: '0 auto' }}>
              <div style={{
                fontSize: 11, fontWeight: 900,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#E52525', letterSpacing: '0.25em',
                textTransform: 'uppercase', marginBottom: 8,
              }}>
                PITCH PILLAR 02 // EFFECTIVENESS & ARCHITECTURE
              </div>
              <h2 style={{
                fontSize: 48, fontWeight: 900,
                fontFamily: "'Inter', sans-serif",
                color: '#FFFFFF', marginBottom: 16,
              }}>
                How It Is <span style={{ color: '#E52525' }}>Effective</span>
              </h2>
              <p style={{
                fontSize: 16, color: '#A0A0A5', maxWidth: 780, lineHeight: 1.6, marginBottom: 36,
              }}>
                EVIDENCE replaces vague AI summaries with a 4-layer deterministic defense system that withstands judicial scrutiny.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 36 }}>
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  padding: 24, borderRadius: 2, display: 'flex', gap: 18,
                }}>
                  <div style={{
                    width: 44, height: 44, background: '#1C1C1E', border: '1px solid #E52525',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    color: '#E52525', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                  }}>01</div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>
                      Deterministic MMO Arithmetic
                    </h3>
                    <p style={{ fontSize: 13, color: '#8E8E93', lineHeight: 1.6 }}>
                      Means (25 pts), Motive (30 pts), Opportunity (35 pts), and Deception (10 pts) are scored via strict mathematical rules. Every point requires an evidentiary citation; zero subjective hallucination is permitted.
                    </p>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  padding: 24, borderRadius: 2, display: 'flex', gap: 18,
                }}>
                  <div style={{
                    width: 44, height: 44, background: '#1C1C1E', border: '1px solid #E52525',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    color: '#E52525', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                  }}>02</div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>
                      The Honesty Gate (Refusal Check)
                    </h3>
                    <p style={{ fontSize: 13, color: '#8E8E93', lineHeight: 1.6 }}>
                      If top suspect score is below 60/100, margin is under 15, or independent sources &lt; 3, the engine <strong>refuses to accuse</strong>. It outputs exact missing evidence required rather than guessing.
                    </p>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  padding: 24, borderRadius: 2, display: 'flex', gap: 18,
                }}>
                  <div style={{
                    width: 44, height: 44, background: '#1C1C1E', border: '1px solid #E52525',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    color: '#E52525', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                  }}>03</div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>
                      Adversarial Defense Counsel
                    </h3>
                    <p style={{ fontSize: 13, color: '#8E8E93', lineHeight: 1.6 }}>
                      Before finalizing an accusation, the engine attacks its own verdict. It tests reasonable doubt, alternate explanations, and alibis to ensure the conviction will stand in front of a real trial judge.
                    </p>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  padding: 24, borderRadius: 2, display: 'flex', gap: 18,
                }}>
                  <div style={{
                    width: 44, height: 44, background: '#1C1C1E', border: '1px solid #E52525',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    color: '#E52525', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                  }}>04</div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>
                      100% Verbatim Audit Trail
                    </h3>
                    <p style={{ fontSize: 13, color: '#8E8E93', lineHeight: 1.6 }}>
                      Judges and attorneys can click any claim to view the exact sentence, raw EXIF metadata, timestamp, and SHA-256 evidence vault hash. No black-box answers.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  onClick={() => setCurrentSlide(3)}
                  style={{
                    background: '#E52525', color: '#FFF', border: 'none',
                    padding: '10px 24px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  NEXT: AWS INTEGRATION →
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════
              SLIDE 3: HOW AWS IS INTEGRATED
              ═════════════════════════════════════════════ */}
          {currentSlide === 3 && (
            <div style={{ maxWidth: 1080, margin: '0 auto' }}>
              <div style={{
                fontSize: 11, fontWeight: 900,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#E52525', letterSpacing: '0.25em',
                textTransform: 'uppercase', marginBottom: 8,
              }}>
                PITCH PILLAR 03 // CLOUD ARCHITECTURE
              </div>
              <h2 style={{
                fontSize: 48, fontWeight: 900,
                fontFamily: "'Inter', sans-serif",
                color: '#FFFFFF', marginBottom: 16,
              }}>
                How <span style={{ color: '#E52525' }}>AWS Is Integrated</span>
              </h2>
              <p style={{
                fontSize: 16, color: '#A0A0A5', maxWidth: 780, lineHeight: 1.6, marginBottom: 36,
              }}>
                AWS infrastructure is a first-class visible citizen in EVIDENCE, powering the 11-stage pipeline and legal chain of custody.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  padding: 22, borderRadius: 2,
                }}>
                  <div style={{ width: 34, height: 34, background: '#FF9900', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Layers size={18} color="#000" />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>AWS Step Functions</h3>
                  <p style={{ fontSize: 12, color: '#8E8E93', lineHeight: 1.5 }}>
                    Executes the 11-stage <code>EVIDENCE_CASE_PIPELINE</code>: Ingest, Parse, Entity Resolution, Timeline, Correlation, Honesty Gate, and Verdict.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  padding: 22, borderRadius: 2,
                }}>
                  <div style={{ width: 34, height: 34, background: '#569A31', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Cloud size={18} color="#FFF" />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Amazon S3 Vault</h3>
                  <p style={{ fontSize: 12, color: '#8E8E93', lineHeight: 1.5 }}>
                    Immutable Evidence Vault enforcing legal chain-of-custody. Computes SHA-256 hashes and timestamp receipts on ingestion.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  padding: 22, borderRadius: 2,
                }}>
                  <div style={{ width: 34, height: 34, background: '#0073BB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Database size={18} color="#FFF" />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Amazon DynamoDB</h3>
                  <p style={{ fontSize: 12, color: '#8E8E93', lineHeight: 1.5 }}>
                    High-throughput, millisecond key-value storage housing the temporal crime timeline and suspect relationship graph nodes.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  padding: 22, borderRadius: 2,
                }}>
                  <div style={{ width: 34, height: 34, background: '#FF4F8B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Cpu size={18} color="#FFF" />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Lambda & Bedrock</h3>
                  <p style={{ fontSize: 12, color: '#8E8E93', lineHeight: 1.5 }}>
                    Serverless microservices running OCR extraction, NER entity linking, and adversarial cross-examination.
                  </p>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 153, 0, 0.08)',
                border: '1px solid rgba(255, 153, 0, 0.4)',
                padding: '16px 24px', borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#FFB84D' }}>
                  STATE MACHINE STATUS: 11/11 States Operational · Automated Fail-Safe Honesty Gate Active
                </span>
                <button
                  onClick={() => setCurrentSlide(4)}
                  style={{
                    background: '#E52525', color: '#FFF', border: 'none',
                    padding: '8px 20px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  CASE WORKFLOW →
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════
              SLIDE 4: END-TO-END INVESTIGATION WORKFLOW
              ═════════════════════════════════════════════ */}
          {currentSlide === 4 && (
            <div style={{ maxWidth: 1080, margin: '0 auto' }}>
              <div style={{
                fontSize: 11, fontWeight: 900,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#E52525', letterSpacing: '0.25em',
                textTransform: 'uppercase', marginBottom: 8,
              }}>
                PITCH PILLAR 04 // END-TO-END CASE VERIFICATION
              </div>
              <h2 style={{
                fontSize: 48, fontWeight: 900,
                fontFamily: "'Inter', sans-serif",
                color: '#FFFFFF', marginBottom: 16,
              }}>
                Live Investigation <span style={{ color: '#E52525' }}>Pipeline</span>
              </h2>
              <p style={{
                fontSize: 15, color: '#A0A0A5', maxWidth: 780, lineHeight: 1.6, marginBottom: 32,
              }}>
                Witness the full automated investigation lifecycle across 3 forensic stages:
              </p>

              {/* 3-Step Interactive Workflow Box */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
                
                {/* Step 1 */}
                <div style={{
                  background: activeStep >= 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                  border: activeStep === 1 ? '2px solid #E52525' : '1px solid rgba(255,255,255,0.1)',
                  padding: 24, borderRadius: 2, position: 'relative',
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                    color: activeStep >= 2 ? '#34D399' : '#E52525', marginBottom: 6,
                  }}>
                    STEP 01 {activeStep >= 2 && '✓ INGESTED'}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>
                    Evidence Ingestion
                  </h3>
                  <p style={{ fontSize: 12, color: '#8E8E93', lineHeight: 1.5, marginBottom: 18 }}>
                    Ingests case files into S3: CCTV transcripts, hotel keycard logs, and 911 dispatch audio.
                  </p>
                  <button
                    onClick={handleQuickIngest}
                    disabled={loading.demo}
                    style={{
                      width: '100%', padding: '10px 0',
                      background: activeStep >= 2 ? '#1E3A2B' : '#E52525',
                      color: '#FFF', border: 'none',
                      fontSize: 11, fontWeight: 800,
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: 'pointer',
                    }}
                  >
                    {loading.demo ? 'INGESTING S3 VAULT…' : activeStep >= 2 ? 'EVIDENCE LOADED (4 FILES)' : '1. INGEST CASE FILES'}
                  </button>
                </div>

                {/* Step 2 */}
                <div style={{
                  background: activeStep >= 2 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                  border: activeStep === 2 ? '2px solid #E52525' : '1px solid rgba(255,255,255,0.1)',
                  padding: 24, borderRadius: 2, position: 'relative',
                  opacity: activeStep < 2 ? 0.4 : 1,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                    color: activeStep >= 3 ? '#34D399' : '#E52525', marginBottom: 6,
                  }}>
                    STEP 02 {activeStep >= 3 && '✓ CONTRADICTION FOUND'}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>
                    Cross-Examine Alibi
                  </h3>
                  <p style={{ fontSize: 12, color: '#8E8E93', lineHeight: 1.5, marginBottom: 18 }}>
                    Engine detects Julianne Reed claimed she was in Boston, but CCTV & keycard place her at the scene.
                  </p>
                  <button
                    onClick={handleQuickSolve}
                    disabled={activeStep < 2 || loading.solve}
                    style={{
                      width: '100%', padding: '10px 0',
                      background: activeStep >= 3 ? '#1E3A2B' : '#E52525',
                      color: '#FFF', border: 'none',
                      fontSize: 11, fontWeight: 800,
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: activeStep < 2 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading.solve ? 'SOLVING CASE PIPELINE…' : activeStep >= 3 ? 'CONTRADICTION PROVEN' : '2. DETECT CONTRADICTIONS'}
                  </button>
                </div>

                {/* Step 3 */}
                <div style={{
                  background: activeStep >= 3 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                  border: activeStep === 3 ? '2px solid #E52525' : '1px solid rgba(255,255,255,0.1)',
                  padding: 24, borderRadius: 2, position: 'relative',
                  opacity: activeStep < 3 ? 0.4 : 1,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                    color: activeStep >= 3 ? '#34D399' : '#E52525', marginBottom: 6,
                  }}>
                    STEP 03
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>
                    Deterministic Verdict
                  </h3>
                  <p style={{ fontSize: 12, color: '#8E8E93', lineHeight: 1.5, marginBottom: 18 }}>
                    Marcus Vance convicted (88% confidence) with means-motive-opportunity arithmetic & citations.
                  </p>
                  <button
                    onClick={onStart}
                    disabled={activeStep < 3}
                    style={{
                      width: '100%', padding: '10px 0',
                      background: '#E52525',
                      color: '#FFF', border: 'none',
                      fontSize: 11, fontWeight: 800,
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: activeStep < 3 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    3. VIEW CONVICTION DOSSIER →
                  </button>
                </div>
              </div>

              {/* Final CTA */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={onStart}
                  style={{
                    background: '#E52525',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '16px 44px',
                    borderRadius: 2,
                    fontSize: 14,
                    fontWeight: 900,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(229, 37, 37, 0.5)',
                  }}
                >
                  LAUNCH FULL INVESTIGATION WORKSPACE →
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── FOOTER & SLIDE CONTROLS ── */}
      <footer style={{
        position: 'relative', zIndex: 20,
        padding: '24px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
          color: '#8E8E93', letterSpacing: '0.12em',
        }}>
          SLIDE 0{currentSlide + 1} / 0{SLIDES.length} · USE KEYBOARD [←] [→] TO PRESENT
        </div>

        {/* Center dot indicators (matching reference layout) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              style={{
                width: currentSlide === idx ? 24 : 8,
                height: 8,
                borderRadius: currentSlide === idx ? 4 : '50%',
                background: currentSlide === idx ? '#E52525' : '#333333',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>

        {/* Prev / Next controls */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
            disabled={currentSlide === 0}
            style={{
              padding: '6px 14px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', color: '#FFF',
              fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
              cursor: currentSlide === 0 ? 'default' : 'pointer',
              opacity: currentSlide === 0 ? 0.3 : 1,
            }}
          >
            ← PREV
          </button>
          <button
            onClick={() => setCurrentSlide((p) => Math.min(SLIDES.length - 1, p + 1))}
            disabled={currentSlide === SLIDES.length - 1}
            style={{
              padding: '6px 14px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', color: '#FFF',
              fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
              cursor: currentSlide === SLIDES.length - 1 ? 'default' : 'pointer',
              opacity: currentSlide === SLIDES.length - 1 ? 0.3 : 1,
            }}
          >
            NEXT →
          </button>
        </div>
      </footer>
    </div>
  );
}
