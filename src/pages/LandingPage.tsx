import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  FlaskConical,
  BrainCircuit,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BookOpen,
  Users,
  CheckCircle2,
  Gauge,
  Flame,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStudentEntry = () => {
    if (user && user.role === 'student') {
      navigate('/dashboard');
    } else {
      navigate('/register?role=student');
    }
  };

  const handleTeacherEntry = () => {
    if (user && user.role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/login?role=teacher');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Class 10 Physics • Chapter 12: Electricity</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Stop Guessing.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Discover How Students Think.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            LearnIQ combines deterministic virtual circuit physics with ThinkTrace reasoning diagnosis to detect hidden conceptual misconceptions, guide personalized recovery, and verify genuine understanding.
          </p>

          {/* Core Innovation Cycle Banner */}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-1.5 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl text-xs font-semibold text-slate-300">
            <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold">1. PREDICT</span>
            <span className="text-slate-600">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300">2. EXPERIMENT</span>
            <span className="text-slate-600">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200">3. OBSERVE</span>
            <span className="text-slate-600">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300">4. EXPLAIN</span>
            <span className="text-slate-600">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-rose-300">5. DIAGNOSE</span>
            <span className="text-slate-600">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-300">6. RECOVER</span>
            <span className="text-slate-600">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-600 text-white font-bold">7. VERIFY</span>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={handleStudentEntry}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-semibold text-sm shadow-xl shadow-cyan-500/25 transition cursor-pointer"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>{user?.role === 'student' ? 'Open Student Dashboard' : 'Student Entry (Register / Login)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleTeacherEntry}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition cursor-pointer"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>{user?.role === 'teacher' ? 'Open Teacher Dashboard' : 'Teacher Portal'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Core Architecture</h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            Engineered for Deep Conceptual Mastery
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg relative group hover:border-cyan-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center border border-cyan-800 mb-4">
              <FlaskConical className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Deterministic Virtual Circuit Lab</h3>
            <p className="text-sm text-slate-400 mt-2">
              Visual schematics with interactive batteries, switches, resistors, and glowing bulbs. Governed by deterministic Ohm's and Kirchhoff's physics equations—never an LLM guessing values.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-cyan-300 font-medium">
              V = IR • Req = R1 + R2 • 1/Req = Σ(1/R)
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg relative group hover:border-blue-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center border border-blue-800 mb-4">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">ThinkTrace Reasoning Evaluator</h3>
            <p className="text-sm text-slate-400 mt-2">
              Evaluates the student's written reasoning, not just the final option. Catches when a student gets the right answer through flawed logic, and flags persistent misconceptions into memory.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-blue-300 font-medium">
              Structured JSON • Gemini 3.8 Flash Engine
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg relative group hover:border-amber-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center border border-amber-800 mb-4">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Classroom Misconception Heatmap</h3>
            <p className="text-sm text-slate-400 mt-2">
              Empowers teachers with actionable educational intelligence. Highlights which concepts confuse the cohort, provides real anonymized reasoning quotes, and suggests targeted class interventions.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-amber-300 font-medium">
              Real Student Records • Actionable Remediation
            </div>
          </div>
        </div>
      </section>

      {/* 8 Concepts Covered */}
      <section className="py-12 bg-slate-900/60 border-t border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Class 10 Syllabus Scope</span>
            <h3 className="text-xl font-bold text-white mt-1">8 Core Electricity Concepts Covered</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { id: 'c1', name: '1. Electric Charge (Q)', formula: 'Q = I × t' },
              { id: 'c2', name: '2. Electric Current (I)', formula: 'I = Q / t' },
              { id: 'c3', name: '3. Potential Difference (V)', formula: 'V = W / Q' },
              { id: 'c4', name: '4. Resistance & Resistivity', formula: 'R = ρ(L/A)' },
              { id: 'c5', name: "5. Ohm's Law", formula: 'V = I × R' },
              { id: 'c6', name: '6. Series Circuits', formula: 'Req = R1 + R2' },
              { id: 'c7', name: '7. Parallel Circuits', formula: '1/Req = Σ(1/R)' },
              { id: 'c8', name: '8. Electric Power & Heat', formula: 'P = VI = I²R' },
            ].map((c) => (
              <div key={c.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="font-semibold text-white block">{c.name}</span>
                <span className="font-mono text-[11px] text-cyan-400 mt-1 block">{c.formula}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
