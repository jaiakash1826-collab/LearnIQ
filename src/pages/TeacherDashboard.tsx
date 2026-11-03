import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TeacherAnalytics } from '../types';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  BrainCircuit,
  Flame,
  Sparkles,
  ChevronRight,
  BookOpen,
  FlaskConical,
  X,
  CheckCircle2,
  Clock,
  ShieldAlert,
  UserPlus,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<(TeacherAnalytics & { classStudents: any[] }) | null>(null);
  const [selectedHeatmapConcept, setSelectedHeatmapConcept] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    setLoading(true);
    try {
      const data = await api.getTeacherDashboard();
      setAnalytics(data);
      if (data.misconceptionHeatmap && data.misconceptionHeatmap.length > 0) {
        setSelectedHeatmapConcept(data.misconceptionHeatmap[0]);
      }
    } catch (e) {
      console.error('Error loading teacher data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        Loading Teacher Intelligence & Classroom Analytics...
      </div>
    );
  }

  const hasStudents = analytics.totalStudents > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 text-xs font-semibold border border-amber-800">
                TEACHER INTELLIGENCE DASHBOARD
              </span>
              <span className="text-slate-400 text-xs">Class 10 Physics: Electricity</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Classroom Conceptual Gap & Intervention Hub
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Live actionable insights aggregated from actual student reasoning models, virtual lab experiments, and misconception records.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Enrolled Students</span>
              <div className="text-2xl font-black text-white">{analytics.totalStudents}</div>
              <span className="text-[11px] text-emerald-400">Class Average: {analytics.classAverageMastery}%</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {!hasStudents && (
          <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/30">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No Students Registered Yet</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              When students register, take diagnostic tests, and conduct experiments in the Virtual Laboratory, their live conceptual mastery and misconception telemetry will populate this dashboard in real time.
            </p>
          </div>
        )}

        {/* ---------------- SECTION 1: CLASSROOM MISCONCEPTION HEATMAP ---------------- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Classroom Misconception Heatmap</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                Identified Learning Gaps Across the Cohort
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregated live from actual student reasoning diagnoses in the Virtual Lab and practice tests.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Heatmap Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {analytics.misconceptionHeatmap.map((item) => {
                const isSelected = selectedHeatmapConcept?.conceptId === item.conceptId;
                let bgSeverity = 'bg-slate-950 border-slate-800 text-slate-400';
                let tagColor = 'bg-slate-800 text-slate-400';

                if (item.severity === 'critical') {
                  bgSeverity = 'bg-rose-950/40 border-rose-800/80 text-rose-200';
                  tagColor = 'bg-rose-950 text-rose-400 border border-rose-800';
                } else if (item.severity === 'moderate') {
                  bgSeverity = 'bg-amber-950/40 border-amber-800/80 text-amber-200';
                  tagColor = 'bg-amber-950 text-amber-400 border border-amber-800';
                } else {
                  bgSeverity = 'bg-slate-950 border-slate-800 text-slate-300';
                  tagColor = 'bg-emerald-950 text-emerald-400 border border-emerald-800';
                }

                return (
                  <button
                    key={item.conceptId}
                    onClick={() => setSelectedHeatmapConcept(item)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer group ${bgSeverity} ${
                      isSelected ? 'ring-2 ring-cyan-400 shadow-lg scale-102' : 'hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tagColor}`}>
                        {item.affectedStudentCount} student{item.affectedStudentCount === 1 ? '' : 's'} ({item.affectedStudentPct}%)
                      </span>
                      <h4 className="text-sm font-bold text-white mt-2 group-hover:text-cyan-300 transition">
                        {item.conceptName}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {item.primaryMisconception}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                      <span>{item.severity}</span>
                      <span>Details →</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Concept Deep Dive Drawer */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
              {selectedHeatmapConcept ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-800">
                          {selectedHeatmapConcept.conceptId.toUpperCase()}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1">
                          {selectedHeatmapConcept.conceptName}
                        </h3>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {selectedHeatmapConcept.affectedStudentCount} Students Affected
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Dominant Misconception Pattern
                      </span>
                      <p className="text-xs font-semibold text-rose-300 mt-0.5">
                        "{selectedHeatmapConcept.primaryMisconception}"
                      </p>
                    </div>

                    {/* Student Evidence Quotes */}
                    {selectedHeatmapConcept.sampleStudentReasoning?.length > 0 ? (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Actual Student Reasoning Evidence
                        </span>
                        <div className="space-y-1.5">
                          {selectedHeatmapConcept.sampleStudentReasoning.map((quote: string, i: number) => (
                            <blockquote
                              key={i}
                              className="text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-slate-300 italic"
                            >
                              {quote}
                            </blockquote>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic py-1">
                        No written misconception quotes recorded for this concept yet.
                      </div>
                    )}

                    {/* Suggested Classroom Intervention Activity */}
                    <div className="bg-blue-950/40 p-3.5 rounded-xl border border-blue-800/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                        Recommended 15-Min Classroom Intervention
                      </span>
                      <p className="text-xs text-blue-200/90 leading-relaxed">
                        {selectedHeatmapConcept.suggestedClassActivity}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500 text-center py-12">
                  Select a concept on the heatmap to review student reasoning errors.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------------- SECTION 2: ACTIONABLE TEACHER RECOMMENDATIONS ---------------- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Pedagogical Intervention Plans</span>
          </div>
          <h2 className="text-xl font-bold text-white">Recommended Teaching Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.teacherRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        rec.priority === 'high'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {rec.priority} Priority
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {rec.affectedConcepts.join(', ')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{rec.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{rec.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <strong className="text-cyan-400 block mb-0.5">Lesson Plan:</strong>
                  <p className="text-[11px] leading-relaxed text-slate-400">{rec.actionablePlan}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- SECTION 3: STUDENT COHORT PERFORMANCE ---------------- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Student Roster & Mastery Breakdown</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">Class 10 Student Profiles</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            {analytics.classStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No students enrolled yet. Students will appear here automatically when they register.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Overall Mastery</th>
                    <th className="p-3">Weakest Concept</th>
                    <th className="p-3">Active Misconception</th>
                    <th className="p-3">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {analytics.classStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-semibold text-white">
                        <div>{s.name}</div>
                        <span className="text-[10px] text-slate-500 font-normal">{s.email}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full ${
                            s.mastery >= 70
                              ? 'bg-emerald-950 text-emerald-400'
                              : s.mastery >= 50
                              ? 'bg-amber-950 text-amber-400'
                              : 'bg-rose-950 text-rose-400'
                          }`}
                        >
                          {s.mastery}%
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{s.weakestConcept}</td>
                      <td className="p-3 text-rose-300/90 max-w-xs truncate">
                        {s.activeMisconception}
                      </td>
                      <td className="p-3 text-slate-400">{s.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
