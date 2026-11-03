import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Zap,
  Activity,
  GitFork,
  FlaskConical,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Users,
  Sparkles,
  ChevronDown,
  LogOut,
  Trash2,
  LogIn,
  UserPlus,
  Mail,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, learnerModel, logout, resetAllData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    if (user && user.role === 'student') {
      api.getStudentMessages(user.id)
        .then((res) => {
          const unread = (res.messages || []).filter((m) => !m.read).length;
          setUnreadMessages(unread);
        })
        .catch(() => {});
    }
  }, [user, location.pathname]);

  interface NavItem {
    to: string;
    label: string;
    icon: any;
    highlight?: boolean;
    badge?: number;
  }

  const studentLinks: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: Activity, badge: unreadMessages > 0 ? unreadMessages : undefined },
    { to: '/diagnostic', label: 'Diagnostic', icon: BookOpen },
    { to: '/graph', label: 'Concept Graph', icon: GitFork },
    { to: '/lab', label: 'Virtual Lab', icon: FlaskConical },
    { to: '/practice', label: 'Practice', icon: Sparkles },
    { to: '/misconceptions', label: 'Misconceptions', icon: AlertTriangle, badge: learnerModel?.activeMisconceptionsCount },
    { to: '/recovery', label: 'Recovery Mode', icon: RotateCcw },
    { to: '/revisions', label: 'Revision Planner', icon: Calendar },
  ];

  const teacherLinks: NavItem[] = [
    { to: '/teacher', label: 'Teacher Dashboard', icon: Activity },
    { to: '/teacher/heatmap', label: 'Misconception Heatmap', icon: AlertTriangle },
    { to: '/teacher/interventions', label: 'AI Interventions', icon: Sparkles },
    { to: '/teacher/students', label: 'Student Cohort', icon: Users },
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to wipe all records and start with a clean database?')) {
      await resetAllData();
      setShowUserMenu(false);
      navigate('/');
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      {/* Top Banner & User Profile Bar */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-semibold text-[11px]">
            <Zap className="w-3 h-3 text-cyan-400" />
            Class 10 Physics: Electricity
          </span>
          <span className="hidden sm:inline text-slate-400 text-[11px]">
            AI-Powered Adaptive Learning & Virtual Lab
          </span>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center gap-2">
          {isStudent && unreadMessages > 0 && (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 text-[11px] font-bold animate-pulse transition shadow-sm cursor-pointer"
              title="You have unread feedback from your teacher"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>{unreadMessages} Teacher Message{unreadMessages > 1 ? 's' : ''}</span>
            </Link>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition text-xs font-medium cursor-pointer"
              >
                <span className={`w-2 h-2 rounded-full ${user.role === 'teacher' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span className="font-semibold">{user.name}</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-900 text-slate-300">
                  {user.role}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1 w-64 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <div className="font-bold text-white text-xs">{user.name}</div>
                    <div className="text-[11px] text-slate-400">{user.email}</div>
                    {user.grade && <div className="text-[10px] text-cyan-400 mt-0.5">{user.grade}</div>}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>

                  <div className="border-t border-slate-800 mt-1 pt-1">
                    <button
                      onClick={handleReset}
                      className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Wipe Clean (Reset Database)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
              >
                <LogIn className="w-3 h-3 text-cyan-400" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                <UserPlus className="w-3 h-3" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white">LearnIQ</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-cyan-500/30">
                  PHYSICS LAB
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5">Predict • Experiment • Discover</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : link.highlight
                      ? 'bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Stats */}
          <div className="flex items-center gap-3">
            {isStudent && learnerModel && (
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Class 10 Mastery</div>
                  <div className="font-bold text-cyan-400 flex items-center gap-1">
                    <span>{learnerModel.overallMastery}%</span>
                    <span className="text-[10px] text-slate-400">
                      ({Object.values(learnerModel.conceptMastery).filter((c) => c.status === 'strong').length}/8 concepts)
                    </span>
                  </div>
                </div>
                <div className="w-12 bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all"
                    style={{ width: `${learnerModel.overallMastery}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quick Link to Virtual Lab */}
            <Link
              to="/lab"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 hover:brightness-110 transition"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Launch Lab</span>
            </Link>
          </div>
        </div>

        {/* Mobile secondary navigation row */}
        <div className="lg:hidden flex overflow-x-auto py-2 gap-1 border-t border-slate-800 no-scrollbar">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`whitespace-nowrap flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};
