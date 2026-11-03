import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MisconceptionRecord } from '../types';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  FlaskConical,
  History,
} from 'lucide-react';

export const MisconceptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [misconceptions, setMisconceptions] = useState<MisconceptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadMisconceptions();
  }, [user]);

  const loadMisconceptions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getMisconceptions(user.id);
      setMisconceptions(res.misconceptions);
    } catch (e) {
      console.error('Error loading misconceptions:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: MisconceptionRecord['status']) => {
    switch (status) {
      case 'suspected':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'under_verification':
        return 'bg-blue-950 text-blue-400 border-blue-800';
      case 'confirmed':
        return 'bg-rose-950 text-rose-400 border-rose-800';
      case 'improving':
        return 'bg-cyan-950 text-cyan-400 border-cyan-800';
      case 'resolved':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
              PERSISTENT LEARNER MODEL
            </span>
            <span className="text-xs text-slate-400">Class 10 Physics: Electricity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-rose-400" />
            <span>Misconception Memory & Verification Loop</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            LearnIQ persistently tracks conceptual mistakes over time. Instead of marking a topic mastered after one lucky guess, we require independent verification before clearing misunderstandings.
          </p>
        </div>

        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            Loading Misconception Records...
          </div>
        ) : misconceptions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Active Conceptual Misconceptions</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Your reasoning across tested Electricity problems has demonstrated sound scientific principles. Continue with adaptive practice to maintain mastery!
            </p>
            <div className="mt-6">
              <Link
                to="/practice"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Take Practice Quiz
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {misconceptions.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.conceptName}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">
                      {item.misconceptionTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(item.status)}`}>
                      {item.status.toUpperCase().replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      {item.occurrences} occurrence{item.occurrences > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.misconceptionDescription}
                </p>

                {/* Evidence Quote from Student */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Recorded Reasoning Evidence
                  </span>
                  <blockquote className="text-rose-300/90 italic">
                    "{item.studentOriginalResponse}"
                  </blockquote>
                  {item.reasoningEvidence && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      ThinkTrace Note: {item.reasoningEvidence}
                    </p>
                  )}
                </div>

                {/* Verification History Log */}
                {item.verificationAttempts.length > 0 && (
                  <div className="text-xs space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Verification History ({item.verificationAttempts.length} checks)</span>
                    </span>
                    <div className="space-y-1">
                      {item.verificationAttempts.map((v, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[11px] text-slate-400 py-1 border-b border-slate-800/40"
                        >
                          <span>{new Date(v.date).toLocaleDateString()}</span>
                          <span className={v.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {v.passed ? 'Passed Verification' : 'Failed Verification'} ({v.reasoningQuality})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                  <Link
                    to={`/lab?concept=${item.conceptId}`}
                    className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1.5"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Investigate in Virtual Lab</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/recovery?concept=${item.conceptId}`)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Start Targeted Recovery</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
