import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Concept, RevisionItem, MisconceptionRecord, TeacherMessage } from '../types';
import {
  Zap,
  FlaskConical,
  BookOpen,
  GitFork,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Sparkles,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  Mail,
  MessageSquare,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, learnerModel, refreshLearnerModel } = useAuth();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [misconceptions, setMisconceptions] = useState<MisconceptionRecord[]>([]);
  const [nextActivity, setNextActivity] = useState<any>(null);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [conceptsRes, revRes, miscRes, nextActRes, expRes, messagesRes] = await Promise.all([
        api.getConcepts(),
        api.getRevisions(user.id),
        api.getMisconceptions(user.id),
        api.getNextRecommendedActivity(user.id),
        api.getCircuitExperiments(user.id),
        api.getStudentMessages(user.id),
      ]);

      setConcepts(conceptsRes.concepts);
      setRevisions(revRes.revisions);
      setMisconceptions(miscRes.misconceptions);
      setNextActivity(nextActRes);
      setExperiments(expRes.experiments);
      setMessages(messagesRes.messages || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await api.markMessageRead(messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, read: true } : m))
      );
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  };

  const activeMisconceptions = misconceptions.filter((m) => m.status !== 'resolved');

  // Identify weak concepts (<50%)
  const weakConcepts = concepts.filter((c) => {
    const cm = learnerModel?.conceptMastery[c.id];
    return (cm?.masteryScore ?? 0) < 50;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Student Account Required</h2>
          <p className="text-xs text-slate-400">
            Sign in or register your student account to record your real conceptual understanding, virtual lab experiments, and diagnostic scores.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold"
            >
              Register Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome & Chapter Progress Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-xs font-semibold border border-cyan-800">
                Class 10 Physics • Chapter 12: Electricity
              </span>
              <span className="text-slate-400 text-xs">Term 2 Syllabus</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Track your conceptual mastery, challenge misconceptions in the Virtual Lab, and follow your personalized recovery path.
            </p>
          </div>

          {/* Quick Mastery Radial / Metric */}
          <div className="flex items-center gap-6 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">
                Overall Electricity Mastery
              </span>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                {learnerModel?.overallMastery ?? 50}%
              </div>
              <span className="text-[11px] text-slate-400">
                {learnerModel?.experimentsCompletedCount ?? 0} Lab Experiments Done
              </span>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-cyan-400 border-r-blue-500 flex items-center justify-center font-bold text-sm text-white">
              {learnerModel?.overallMastery ?? 50}%
            </div>
          </div>
        </div>

        {/* Recommended Next Action Banner */}
        {nextActivity && (
          <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-800/50 p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 flex-shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Recommended Next Learning Step
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{nextActivity.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{nextActivity.reason}</p>
              </div>
            </div>

            <Link
              to={nextActivity.actionUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-semibold text-xs transition cursor-pointer shadow-md shadow-cyan-500/20 whitespace-nowrap"
            >
              <span>Start Activity</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Active Misconceptions Alert Box */}
        {activeMisconceptions.length > 0 && (
          <div className="bg-rose-950/40 border border-rose-800/60 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-rose-200">
                  Misconception Memory: {activeMisconceptions.length} Active Conceptual Gap{activeMisconceptions.length > 1 ? 's' : ''} Detected
                </h3>
              </div>
              <Link
                to="/misconceptions"
                className="text-xs font-semibold text-rose-300 hover:underline flex items-center gap-1"
              >
                <span>View Full Evidence Log</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {activeMisconceptions.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-900/90 p-3.5 rounded-xl border border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{m.misconceptionTitle}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-medium">
                        {m.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Concept: <strong className="text-slate-300">{m.conceptName}</strong> • {m.reasoningEvidence}
                    </p>
                  </div>
                  <Link
                    to={`/recovery?concept=${m.conceptId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Launch Recovery Journey</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teacher Guidance & Assessment Feedback Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Teacher Guidance & Assessment Feedback</h3>
                  {messages.filter((m) => !m.read).length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold animate-pulse">
                      {messages.filter((m) => !m.read).length} New
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Direct communication, test reviews, and study suggestions from your teacher
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-semibold">
                {messages.length} Message{messages.length === 1 ? '' : 's'} Total
              </span>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="p-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-center text-xs text-slate-400">
              <MessageSquare className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No teacher messages yet</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                When your instructor reviews your Electricity Diagnostic assessment or Virtual Lab experiments, their personalized recommendations and test feedback will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border transition ${
                    !m.read
                      ? 'bg-slate-950/90 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">{m.subject}</span>
                        {!m.read && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-cyan-500 text-slate-950">
                            NEW
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          From Teacher: {m.teacherName}
                        </span>
                        {m.testScoreInfo && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {m.testScoreInfo}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        Received on {new Date(m.createdAt).toLocaleDateString()} at{' '}
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex-shrink-0">
                      {!m.read ? (
                        <button
                          onClick={() => handleMarkAsRead(m.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark as Read</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Read</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {m.message}
                  </div>

                  {/* Contextual Action Shortcut */}
                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      Electricity Class 10 • Feedback
                    </span>
                    <div className="flex gap-2">
                      <Link
                        to="/lab"
                        className="text-cyan-400 hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        <FlaskConical className="w-3 h-3" />
                        <span>Launch Lab</span>
                      </Link>
                      <Link
                        to="/practice"
                        className="text-slate-400 hover:text-white inline-flex items-center gap-1 text-xs"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Practice</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 8 Concept Mastery Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Concept Mastery Map</span>
                <span className="text-xs font-normal text-slate-400">(8 Topics in Class 10 Electricity)</span>
              </h2>
            </div>
            <Link
              to="/graph"
              className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Explore Interactive Prerequisite Graph</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {concepts.map((concept) => {
              const cm = learnerModel?.conceptMastery[concept.id];
              const score = cm?.masteryScore ?? 50;
              const status = cm?.status ?? 'developing';

              return (
                <div
                  key={concept.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex flex-col justify-between transition group shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {concept.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          status === 'strong'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : status === 'developing'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {score}% {status.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition">
                      {concept.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {concept.shortDescription}
                    </p>

                    <div className="mt-3">
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            status === 'strong'
                              ? 'bg-emerald-500'
                              : status === 'developing'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <Link
                      to={`/lab?concept=${concept.id}`}
                      className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Lab</span>
                    </Link>
                    <Link
                      to={`/practice?concept=${concept.id}`}
                      className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Practice</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dual Column: Revision Planner + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Spaced Repetition Revisions */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Spaced Repetition Schedule</h3>
              </div>
              <Link to="/revisions" className="text-xs text-cyan-400 hover:underline">
                View All
              </Link>
            </div>

            {revisions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                All scheduled revisions up to date! Great job.
              </p>
            ) : (
              <div className="space-y-3">
                {revisions.slice(0, 3).map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{rev.conceptName}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            rev.status === 'due'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {rev.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Due: {rev.dueDate} • Recommended: {rev.recommendedQuestionsCount} quick checks
                      </span>
                    </div>
                    <Link
                      to={`/practice?concept=${rev.conceptId}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Virtual Lab Launcher */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-3xl shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Signature Virtual Lab Presets</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Test hypotheses with real deterministic physics calculations and receive instant ThinkTrace reasoning diagnosis.
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link
                  to="/lab?preset=single"
                  className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition group"
                >
                  <span className="font-bold text-white group-hover:text-cyan-400 block">
                    Ohm's Law Lab
                  </span>
                  <span className="text-[11px] text-slate-400">V = I × R Verification</span>
                </Link>

                <Link
                  to="/lab?preset=series"
                  className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition group"
                >
                  <span className="font-bold text-white group-hover:text-cyan-400 block">
                    Series Circuit
                  </span>
                  <span className="text-[11px] text-slate-400">Current Conservation</span>
                </Link>

                <Link
                  to="/lab?preset=parallel"
                  className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition group"
                >
                  <span className="font-bold text-white group-hover:text-cyan-400 block">
                    Parallel Branches
                  </span>
                  <span className="text-[11px] text-slate-400">1/Req Reciprocal Addition</span>
                </Link>

                <Link
                  to="/lab?preset=power"
                  className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition group"
                >
                  <span className="font-bold text-white group-hover:text-cyan-400 block">
                    Bulb Brightness
                  </span>
                  <span className="text-[11px] text-slate-400">P = I²R vs P = V²/R</span>
                </Link>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Deterministic JS Physics Engine</span>
              <Link to="/lab" className="text-cyan-400 font-semibold hover:underline">
                Open Full Workbench →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
