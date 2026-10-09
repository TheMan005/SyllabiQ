import React from 'react';
import {
  FileText,
  Sliders,
  BookOpen,
  ShieldCheck,
  Play,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AgentExecutionLog } from '../types/assessment';
import { COURSE_PRESETS } from '../data/sampleCourses';

interface MultiAgentPipelineBarProps {
  logs: AgentExecutionLog[];
  isRunningPipeline: boolean;
  activeStepIndex: number | null;
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onRunFullPipeline: () => void;
  onRunSingleAgent: (agentId: 'INGESTION' | 'BLUEPRINT' | 'GENERATOR' | 'VALIDATOR') => void;
  onNavigateTab: (tab: 'studio' | 'blueprint' | 'paper' | 'audit' | 'colab') => void;
  documentCount: number;
  totalMarks: number;
  questionCount: number;
  alignmentScore: number;
  flaggedCount: number;
}

export const MultiAgentPipelineBar: React.FC<MultiAgentPipelineBarProps> = ({
  logs,
  isRunningPipeline,
  selectedPresetId,
  onSelectPreset,
  onRunFullPipeline,
  onRunSingleAgent,
  onNavigateTab,
  documentCount,
  totalMarks,
  questionCount,
  alignmentScore,
  flaggedCount,
}) => {
  const [showLogs, setShowLogs] = React.useState(false);

  const agentConfig = [
    {
      id: 'INGESTION' as const,
      number: '01.',
      title: 'Multimodal Ingestion',
      subtitle: `${documentCount} files · PDF, PPTX, JPEG, PNG`,
      icon: FileText,
      targetTab: 'studio' as const,
    },
    {
      id: 'BLUEPRINT' as const,
      number: '02.',
      title: 'Blueprint Architect',
      subtitle: `${totalMarks} marks matrix · CO & Bloom's`,
      icon: Sliders,
      targetTab: 'blueprint' as const,
    },
    {
      id: 'GENERATOR' as const,
      number: '03.',
      title: 'Question Paper Generator',
      subtitle: `${questionCount} questions · Answer rubrics`,
      icon: BookOpen,
      targetTab: 'paper' as const,
    },
    {
      id: 'VALIDATOR' as const,
      number: '04.',
      title: 'Syllabus & CO Validator',
      subtitle:
        flaggedCount > 0
          ? `${alignmentScore}% aligned · ${flaggedCount} needs review`
          : `${alignmentScore}% aligned · All verified`,
      icon: ShieldCheck,
      targetTab: 'audit' as const,
    },
  ];

  return (
    <section className="bg-white border-b border-slate-200 no-print">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        {/* Top Row: Course Context Bar & Execution Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="course-preset-select"
              className="text-xs font-semibold text-slate-500 whitespace-nowrap shrink-0"
            >
              Active Course Kit:
            </label>
            <select
              id="course-preset-select"
              value={selectedPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              disabled={isRunningPipeline}
              className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              {COURSE_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500 hidden sm:inline">
              · Multimodal Gemini 3.8 Flash + FastAPI Pipeline
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowLogs((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <span>Agent Activity Log</span>
              {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onRunFullPipeline}
              disabled={isRunningPipeline}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isRunningPipeline ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing 4-Agent Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute All 4 Agents</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4-Agent Orchestration Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          {agentConfig.map((agent) => {
            const log = logs.find((l) => l.agentId === agent.id);
            const status = log?.status || 'COMPLETED';
            const IconComponent = agent.icon;

            return (
              <div
                key={agent.id}
                className={`flex flex-col justify-between p-3.5 rounded-lg border transition-colors ${
                  status === 'RUNNING'
                    ? 'bg-blue-50/60 border-blue-600'
                    : status === 'ERROR'
                    ? 'bg-red-50/40 border-red-300'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateTab(agent.targetTab)}
                    className="text-left group focus:outline-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono-tabular font-semibold text-blue-900">
                        {agent.number}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                        {agent.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-mono-tabular">{agent.subtitle}</p>
                  </button>
                  <IconComponent className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                </div>

                <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    {status === 'RUNNING' && (
                      <span className="inline-flex items-center gap-1 text-blue-800 font-semibold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Running</span>
                      </span>
                    )}
                    {status === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready</span>
                        {log?.durationMs ? (
                          <span className="text-slate-400 font-mono-tabular">
                            · {(log.durationMs / 1000).toFixed(1)}s
                          </span>
                        ) : null}
                      </span>
                    )}
                    {status === 'ERROR' && (
                      <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Attention</span>
                      </span>
                    )}
                    {status === 'IDLE' && <span className="text-slate-500">Standby</span>}
                  </div>

                  <button
                    type="button"
                    disabled={isRunningPipeline}
                    onClick={() => onRunSingleAgent(agent.id)}
                    className="text-xs font-medium text-blue-800 hover:text-blue-950 hover:underline disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Re-run Agent
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsible Agent Execution Trace Drawer */}
        {showLogs && (
          <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-800">
                Multi-Agent Handshake & Execution Trace
              </h3>
              <span className="text-xs text-slate-500 font-mono-tabular">
                Sequential State Handoff: Agent 01 → Agent 02 → Agent 03 → Agent 04
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {logs.map((log) => (
                <div key={log.agentId} className="bg-white border border-slate-200 rounded-md p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span>{log.agentName}</span>
                    <span className="font-mono-tabular text-slate-500">{log.status}</span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">{log.headline}</p>
                  {log.details.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-xs text-slate-500 font-mono-tabular">
                      {log.details.map((d, i) => (
                        <li key={i}>• {d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
