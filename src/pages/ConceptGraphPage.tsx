import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ConceptGraphView } from '../components/graph/ConceptGraphView';
import { GitFork, AlertTriangle, Info, BookOpen } from 'lucide-react';

export const ConceptGraphPage: React.FC = () => {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadGraph();
  }, [user]);

  const loadGraph = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getConceptGraph(user.id);
      setNodes(res.nodes);
      setEdges(res.edges);
    } catch (e) {
      console.error('Error loading concept graph:', e);
    } finally {
      setLoading(false);
    }
  };

  const prereqGapsCount = edges.filter((e) => e.isPrereqGap).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              KNOWLEDGE MAP
            </span>
            <span className="text-xs text-slate-400">Class 10 Physics: Electricity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <GitFork className="w-7 h-7 text-cyan-400" />
            <span>Interactive Concept & Prerequisite Graph</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Explore how concepts connect. LearnIQ tracks your mastery across foundational topics and highlights prerequisite gaps before you tackle advanced circuit analysis.
          </p>
        </div>

        {prereqGapsCount > 0 && (
          <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-2xl flex items-center gap-3 text-xs text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <strong>Prerequisite Gap Alert:</strong> Red dotted arrows indicate foundational concepts that need reinforcement to unlock advanced topics.
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            Loading Knowledge Graph...
          </div>
        ) : (
          <ConceptGraphView nodes={nodes} edges={edges} />
        )}

        {/* Syllabus Scope Breakdown */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-xs space-y-3">
          <h4 className="font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Educational Structure & Validation</span>
          </h4>
          <p className="text-slate-400 leading-relaxed">
            The knowledge graph represents standard Class 10 Physics curricula. Concepts are strictly connected through validated prerequisite relationships: Electric Charge is the foundation for Current and Potential Difference, which together govern Resistance and Ohm's Law, forming the basis for Series and Parallel combinations, and ultimately Electric Power and Joule's Heating.
          </p>
        </div>
      </div>
    </div>
  );
};
