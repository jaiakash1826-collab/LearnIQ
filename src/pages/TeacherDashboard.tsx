import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TeacherAnalytics, TeacherMessage } from '../types';
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
  Mail,
  Send,
  MessageSquare,
  Check,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<(TeacherAnalytics & { classStudents: any[] }) | null>(null);
  const [selectedHeatmapConcept, setSelectedHeatmapConcept] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Messaging Modal State
  const [messagingStudent, setMessagingStudent] = useState<any | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSuccessToast, setMessageSuccessToast] = useState<string | null>(null);

  // Sent Messages History
  const [sentMessages, setSentMessages] = useState<TeacherMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    loadTeacherData();
    if (user?.id) {
      loadSentMessages(user.id);
    }
  }, [user]);

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

  const loadSentMessages = async (teacherId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.getTeacherMessages(teacherId);
      setSentMessages(res.messages || []);
    } catch (e) {
      console.error('Error loading sent messages:', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleOpenMessageModal = (student: any) => {
    setMessagingStudent(student);
    setMessageSubject(`Feedback on Electricity Test: ${student.weakestConcept || 'General Assessment'}`);
    setMessageBody(
      `Hi ${student.name},\n\nI reviewed your Class 10 Physics test attempt (Overall Mastery: ${student.mastery}%). I noticed you are encountering challenges with ${student.weakestConcept}.\n\nI recommend launching the Virtual Circuit Lab to test this concept interactively, especially observing how current and voltage behave. Let me know if you have questions!\n\nBest,\n${user?.name || 'Your Teacher'}`
    );
  };

  const handleApplyTemplate = (type: 'review' | 'lab' | 'kudos') => {
    if (!messagingStudent) return;
    if (type === 'review') {
      setMessageSubject(`Targeted Support: Reviewing ${messagingStudent.weakestConcept}`);
      setMessageBody(
        `Hi ${messagingStudent.name},\n\nFollowing your test score of ${messagingStudent.mastery}%, let's focus on reinforcing ${messagingStudent.weakestConcept}. Please revisit the prerequisite formulas in the Concept Graph and complete the targeted practice questions today.\n\nKeep up the effort!\n- ${user?.name || 'Your Teacher'}`
      );
    } else if (type === 'lab') {
      setMessageSubject(`Virtual Lab Recommendation: Test & Observe`);
      setMessageBody(
        `Hi ${messagingStudent.name},\n\nTo build stronger physical intuition for your test, please open the Virtual Physics Laboratory on LearnIQ. Try setting up the circuit with different resistor values to see the calculated current live!\n\nBest,\n- ${user?.name || 'Your Teacher'}`
      );
    } else {
      setMessageSubject(`Great Progress on Physics Assessment!`);
      setMessageBody(
        `Hi ${messagingStudent.name},\n\nGreat job on attending the Electricity test! Continue maintaining your learning streak and check your Spaced Repetition planner to lock in your mastery.\n\nWell done,\n- ${user?.name || 'Your Teacher'}`
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !messagingStudent || !messageBody.trim()) return;

    setSendingMessage(true);
    try {
      const res = await api.sendMessage({
        teacherId: user.id,
        teacherName: user.name || 'Physics Teacher',
        studentId: messagingStudent.id,
        studentName: messagingStudent.name,
        subject: messageSubject.trim() || 'Teacher Feedback on Test',
        message: messageBody.trim(),
        testScoreInfo: `Mastery: ${messagingStudent.mastery}% • Weakest: ${messagingStudent.weakestConcept}`,
      });

      setMessageSuccessToast(`Message sent successfully to ${messagingStudent.name}!`);
      setTimeout(() => setMessageSuccessToast(null), 4000);
      setMessagingStudent(null);
      setMessageBody('');
      // Refresh sent messages log
      if (user?.id) {
        loadSentMessages(user.id);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
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
        {/* Success Toast */}
        {messageSuccessToast && (
          <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-950 border border-emerald-500 text-emerald-200 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-semibold">{messageSuccessToast}</span>
          </div>
        )}

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

        {/* ---------------- SECTION 2: STUDENT ROSTER & DIRECT MESSAGING ---------------- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <Users className="w-4 h-4" />
                <span>Student Roster & Direct Communication</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Class 10 Student Profiles & Test Attendees
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Message students who attended the test to provide personal pedagogical feedback, encouragement, and targeted lab recommendations.
              </p>
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
                    <th className="p-3">Test Attendance</th>
                    <th className="p-3">Overall Mastery</th>
                    <th className="p-3">Weakest Concept</th>
                    <th className="p-3">Active Misconception</th>
                    <th className="p-3">Last Active</th>
                    <th className="p-3 text-right">Teacher Action</th>
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
                        {s.testAttended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Attended Test</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                            <span>Pending Test</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full ${
                            s.mastery >= 70
                              ? 'bg-emerald-950 text-emerald-400'
                              : s.mastery >= 45
                              ? 'bg-amber-950 text-amber-400'
                              : 'bg-rose-950 text-rose-400'
                          }`}
                        >
                          {s.mastery}%
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 font-medium">{s.weakestConcept}</td>
                      <td className="p-3 text-rose-300/90 max-w-xs truncate">
                        {s.activeMisconception}
                      </td>
                      <td className="p-3 text-slate-400">{s.lastActive}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenMessageModal(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Message Student</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ---------------- SECTION 3: TEACHER SENT MESSAGES LOG ---------------- */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-bold text-white">Sent Teacher Messages & Interventions</h3>
                <p className="text-xs text-slate-400">Communication history with students</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
              {sentMessages.length} Message{sentMessages.length === 1 ? '' : 's'} Sent
            </span>
          </div>

          {loadingMessages ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading sent messages...</div>
          ) : sentMessages.length === 0 ? (
            <div className="p-6 bg-slate-950 border border-slate-800/80 rounded-2xl text-center text-xs text-slate-400">
              No messages sent yet. Click "Message Student" on any student in the roster above to send personalized test feedback!
            </div>
          ) : (
            <div className="space-y-3">
              {sentMessages.map((m) => (
                <div
                  key={m.id}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white">{m.subject}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-800 font-semibold">
                        To: {m.studentName}
                      </span>
                      {m.testScoreInfo && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {m.testScoreInfo}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 whitespace-pre-line leading-relaxed">{m.message}</p>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 flex-shrink-0">
                    <span className="text-[11px] text-slate-400">
                      {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.read
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {m.read ? 'Read by Student' : 'Sent / Unread'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---------------- SECTION 4: ACTIONABLE TEACHER RECOMMENDATIONS ---------------- */}
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

        {/* ================= MESSAGE STUDENT MODAL ================= */}
        {messagingStudent && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 max-w-2xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-5 animate-in zoom-in-95">
              {/* Close Button */}
              <button
                onClick={() => setMessagingStudent(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Send Feedback to {messagingStudent.name}
                  </h3>
                  <p className="text-xs text-slate-400">{messagingStudent.email}</p>
                </div>
              </div>

              {/* Student Test Performance Card */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Test Status
                  </span>
                  <span className={`text-xs font-bold ${messagingStudent.testAttended ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {messagingStudent.testAttended ? '✓ Attended Test' : 'Pending Test'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Test Mastery
                  </span>
                  <span className="text-sm font-bold text-cyan-400">{messagingStudent.mastery}%</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Weakest Concept
                  </span>
                  <span className="text-xs font-bold text-amber-400 truncate block">{messagingStudent.weakestConcept}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Misconception
                  </span>
                  <span className="text-xs font-semibold text-rose-300 truncate block">
                    {messagingStudent.activeMisconception}
                  </span>
                </div>
              </div>

              {/* Template Shortcuts */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Quick Message Templates:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('review')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    Target Weak Concepts
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('lab')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition cursor-pointer"
                  >
                    Recommend Virtual Lab
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('kudos')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition cursor-pointer"
                  >
                    Encouragement on Test
                  </button>
                </div>
              </div>

              {/* Message Form */}
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    placeholder="Feedback subject..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Message to Student
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Write your advice, test review, or encouragement..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMessagingStudent(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMessage || !messageBody.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sendingMessage ? 'Sending...' : 'Send Message to Student'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
