import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RevisionItem } from '../types';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export const RevisionPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadRevisions();
  }, [user]);

  const loadRevisions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getRevisions(user.id);
      setRevisions(res.revisions);
    } catch (e) {
      console.error('Error fetching revisions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (revId: string) => {
    try {
      await api.completeRevision(revId);
      await loadRevisions();
    } catch (e) {
      console.error('Error completing revision:', e);
    }
  };

  const dueItems = revisions.filter((r) => r.status === 'due');
  const upcomingItems = revisions.filter((r) => r.status === 'upcoming');
  const completedItems = revisions.filter((r) => r.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-800">
              SPACED REPETITION
            </span>
            <span className="text-xs text-slate-400">Memory Retention Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Calendar className="w-7 h-7 text-cyan-400" />
            <span>Spaced Repetition & Revision Planner</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Retaining physics requires timely review before the forgetting curve takes effect. Revision intervals are dynamically calibrated based on your current concept mastery.
          </p>
        </div>

        {/* Policy Info Accordion */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Dynamic Scheduling Policy:</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-rose-300">&lt;40% : 1 Day</span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300">40-59% : 2 Days</span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-yellow-300">60-79% : 4 Days</span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300">80-89% : 7 Days</span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-300">≥90% : 14 Days</span>
          </div>
        </div>

        {/* Due Now */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Revisions Due Today ({dueItems.length})</span>
          </h3>

          {dueItems.length === 0 ? (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
              No revisions due right now. You are fully caught up!
            </div>
          ) : (
            dueItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-rose-900/60 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{item.conceptName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                      DUE TODAY
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Mastery: {item.masteryLevel}% • Target: {item.recommendedQuestionsCount} quick questions
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkDone(item.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  >
                    Mark Reviewed
                  </button>
                  <Link
                    to={`/practice?concept=${item.conceptId}`}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Practice Now</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upcoming */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Upcoming Scheduled Reviews ({upcomingItems.length})</span>
          </h3>

          {upcomingItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-white block">{item.conceptName}</span>
                <span className="text-[11px] text-slate-400">Scheduled for: {item.dueDate}</span>
              </div>
              <span className="font-mono text-cyan-400 font-semibold">{item.masteryLevel}% Mastery</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
