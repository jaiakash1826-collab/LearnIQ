import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitFork,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  FlaskConical,
  X,
  Sparkles,
} from 'lucide-react';

interface GraphNode {
  id: string;
  code: string;
  name: string;
  shortDescription?: string;
  order: number;
  prerequisites: string[];
  masteryScore: number;
  status: 'weak' | 'developing' | 'strong';
  hasActiveMisconception: boolean;
  hasPrerequisiteGap: boolean;
  standardFormulas: string[];
  unit: string;
  commonMisconceptions: {
    id: string;
    title: string;
    description: string;
    correctScientificPrinciple: string;
  }[];
  realWorldApplication: string;
  x?: number;
  y?: number;
}

interface ConceptGraphViewProps {
  nodes: GraphNode[];
  edges: { source: string; target: string; isPrereqGap: boolean }[];
  onSelectConcept?: (conceptId: string) => void;
}

export const ConceptGraphView: React.FC<ConceptGraphViewProps> = ({ nodes, edges }) => {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(nodes[0] || null);

  // Position nodes in an educational learning topology
  const nodePositions: Record<string, { x: number; y: number }> = {
    c1: { x: 100, y: 180 }, // Electric Charge (Root)
    c2: { x: 260, y: 100 }, // Current
    c3: { x: 260, y: 260 }, // Potential Difference
    c4: { x: 420, y: 100 }, // Resistance
    c5: { x: 420, y: 260 }, // Ohm's Law
    c6: { x: 580, y: 100 }, // Series Circuits
    c7: { x: 580, y: 260 }, // Parallel Circuits
    c8: { x: 740, y: 180 }, // Electric Power & Heating
  };

  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Class 10 Physics Prerequisite Knowledge Map</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            <span className="text-slate-300">Strong (≥75%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
            <span className="text-slate-300">Developing (45-74%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
            <span className="text-slate-300">Weak (&lt;45%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Graph SVG Canvas */}
        <div className="lg:col-span-2 p-6 bg-slate-950/70 overflow-x-auto flex items-center justify-center">
          <div className="relative w-[840px] h-[380px] flex-shrink-0 select-none">
            <svg viewBox="0 0 840 380" className="w-full h-full">
              <defs>
                <marker
                  id="arrowNormal"
                  markerWidth="8"
                  markerHeight="8"
                  refX="18"
                  refY="4"
                  orient="auto"
                >
                  <path d="M 0 0 L 8 4 L 0 8 z" fill="#475569" />
                </marker>
                <marker
                  id="arrowPrereqGap"
                  markerWidth="8"
                  markerHeight="8"
                  refX="18"
                  refY="4"
                  orient="auto"
                >
                  <path d="M 0 0 L 8 4 L 0 8 z" fill="#F43F5E" />
                </marker>
              </defs>

              {/* Prerequisite Edges */}
              {edges.map((edge, idx) => {
                const sPos = nodePositions[edge.source];
                const tPos = nodePositions[edge.target];
                if (!sPos || !tPos) return null;

                const isGap = edge.isPrereqGap;

                return (
                  <g key={`edge-${idx}`}>
                    <line
                      x1={sPos.x}
                      y1={sPos.y}
                      x2={tPos.x}
                      y2={tPos.y}
                      stroke={isGap ? '#F43F5E' : '#334155'}
                      strokeWidth={isGap ? 2.5 : 1.5}
                      strokeDasharray={isGap ? '4 4' : undefined}
                      markerEnd={isGap ? 'url(#arrowPrereqGap)' : 'url(#arrowNormal)'}
                    />
                    {isGap && (
                      <circle
                        cx={(sPos.x + tPos.x) / 2}
                        cy={(sPos.y + tPos.y) / 2}
                        r="8"
                        fill="#F43F5E"
                        className="animate-ping"
                      />
                    )}
                  </g>
                );
              })}

              {/* Concept Nodes */}
              {nodes.map((node) => {
                const pos = nodePositions[node.id] || { x: 100, y: 100 };
                const isSelected = selectedNode?.id === node.id;

                let ringColor = 'border-slate-700 bg-slate-900 text-slate-300';
                let strokeColor = '#334155';
                let fillColor = '#0F172A';

                if (node.status === 'strong') {
                  strokeColor = '#10B981';
                  fillColor = '#064E3B';
                } else if (node.status === 'developing') {
                  strokeColor = '#F59E0B';
                  fillColor = '#78350F';
                } else {
                  strokeColor = '#F43F5E';
                  fillColor = '#881337';
                }

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer group"
                    onClick={() => setSelectedNode(node)}
                  >
                    {/* Node Card */}
                    <rect
                      x="-70"
                      y="-40"
                      width="140"
                      height="80"
                      rx="12"
                      fill={fillColor}
                      stroke={isSelected ? '#38BDF8' : strokeColor}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all duration-200 group-hover:scale-105"
                      style={{
                        transformOrigin: '0 0',
                        filter: isSelected ? 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.5))' : undefined,
                      }}
                    />

                    {/* Node Badge */}
                    <text
                      x="0"
                      y="-22"
                      fill="#94A3B8"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {node.code}
                    </text>

                    {/* Concept Name */}
                    <text
                      x="0"
                      y="-4"
                      fill="#FFFFFF"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {node.name.length > 18 ? node.name.substring(0, 16) + '...' : node.name}
                    </text>

                    {/* Mastery Score Badge */}
                    <rect x="-30" y="10" width="60" height="18" rx="9" fill="#0F172A" stroke={strokeColor} strokeWidth="1" />
                    <text
                      x="0"
                      y="23"
                      fill={node.status === 'strong' ? '#34D399' : node.status === 'developing' ? '#FBBF24' : '#FB7185'}
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {node.masteryScore}% Mastery
                    </text>

                    {/* Prerequisite Gap Alert Beacon */}
                    {node.hasPrerequisiteGap && (
                      <g transform="translate(56, -30)">
                        <circle cx="0" cy="0" r="10" fill="#F43F5E" />
                        <text x="0" y="4" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle">!</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Concept Deep Dive Drawer */}
        <div className="p-6 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/40 text-cyan-300 border border-cyan-800">
                    {selectedNode.code}
                  </span>
                  <h4 className="text-base font-bold text-white mt-1">{selectedNode.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{selectedNode.shortDescription}</p>
                </div>
              </div>

              {/* Mastery Indicator */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-400">Your Conceptual Mastery</span>
                  <span
                    className={`font-bold ${
                      selectedNode.status === 'strong'
                        ? 'text-emerald-400'
                        : selectedNode.status === 'developing'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {selectedNode.masteryScore}% ({selectedNode.status.toUpperCase()})
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedNode.status === 'strong'
                        ? 'bg-emerald-500'
                        : selectedNode.status === 'developing'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${selectedNode.masteryScore}%` }}
                  />
                </div>
              </div>

              {/* Prerequisite Alert if Gap Detected */}
              {selectedNode.hasPrerequisiteGap && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-rose-200">Prerequisite Gap Detected</h5>
                    <p className="text-[11px] text-rose-300 mt-0.5">
                      Understanding of prerequisite topics is below 50%. Revisit foundational concepts before advancing.
                    </p>
                  </div>
                </div>
              )}

              {/* Standard Formulas */}
              <div>
                <h5 className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                  Governing Formulas
                </h5>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedNode.standardFormulas.map((f, i) => (
                    <span
                      key={i}
                      className="font-mono text-xs px-2.5 py-1 rounded bg-slate-800 text-cyan-300 border border-slate-700"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Common Misconception Warning */}
              {selectedNode.commonMisconceptions.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-800/60 p-3 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Watch Out: Common Misconception
                  </span>
                  <p className="text-xs font-semibold text-amber-200">
                    "{selectedNode.commonMisconceptions[0].title}"
                  </p>
                  <p className="text-[11px] text-amber-300/80 mt-1">
                    {selectedNode.commonMisconceptions[0].correctScientificPrinciple}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => navigate(`/lab?concept=${selectedNode.id}`)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-blue-600/20"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>Investigate in Virtual Lab</span>
                </button>
                <button
                  onClick={() => navigate(`/practice?concept=${selectedNode.id}`)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Practice Adaptive Questions</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Select a node from the map to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
