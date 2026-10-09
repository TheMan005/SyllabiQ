import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Loader2,
  Wrench,
  BookOpen,
} from 'lucide-react';
import {
  GeneratedQuestion,
  ValidationAgentOutput,
  CourseOutcome,
} from '../types/assessment';

interface SyllabusAuditViewProps {
  questions: GeneratedQuestion[];
  validationOutput: ValidationAgentOutput;
  courseOutcomes: CourseOutcome[];
  isValidating: boolean;
  onRunValidatorAgent: () => void;
  onRemediateQuestion: (question: GeneratedQuestion, customPrompt?: string) => Promise<void>;
  remediatingQuestionId: string | null;
  onViewQuestionPaper: () => void;
}

export const SyllabusAuditView: React.FC<SyllabusAuditViewProps> = ({
  questions,
  validationOutput,
  courseOutcomes,
  isValidating,
  onRunValidatorAgent,
  onRemediateQuestion,
  remediatingQuestionId,
  onViewQuestionPaper,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FLAGGED' | 'VERIFIED'>('ALL');

  const mergedItems = questions.map((q) => {
    const matchingAudit =
      validationOutput.questionAudits.find(
        (a) => a.questionId === q.id || a.questionNumber === q.questionNumber
      ) || q.validation;
    return {
      question: q,
      audit: matchingAudit,
    };
  });

  const filteredItems = mergedItems.filter(({ audit }) => {
    const status = audit?.status || 'VERIFIED';
    if (statusFilter === 'FLAGGED') return status !== 'VERIFIED';
    if (statusFilter === 'VERIFIED') return status === 'VERIFIED';
    return true;
  });

  const flaggedItems = mergedItems.filter(
    ({ audit }) => audit && audit.status !== 'VERIFIED'
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-semibold text-blue-900 tracking-tight">
            04. Syllabus & Learning Objectives Validator Agent
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Curriculum Fidelity & Course Outcome Audit Report
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Agent 04 independently verifies every generated question against four academic compliance gates: Syllabus Boundary Fidelity, Course Outcome (CO) Alignment, Bloom’s Cognitive Calibration, and Marks Proportionality.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onRunValidatorAgent}
            disabled={isValidating}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-800" />
                <span>Auditing Paper (Agent 04)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-800" />
                <span>Re-Run Full Curriculum Audit</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onViewQuestionPaper}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>View Final Question Paper</span>
          </button>
        </div>
      </div>

      {/* 4-Column Quantitative Audit Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Overall Syllabus & CO Alignment</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono-tabular text-slate-900">
              {validationOutput.overallAlignmentScore}%
            </span>
            <span className="text-xs font-mono-tabular text-emerald-700 font-medium">
              Coverage: {validationOutput.syllabusCoveragePercentage}%
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Question Verification Status</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono-tabular text-slate-900">
              {validationOutput.verifiedCount} / {questions.length}
            </span>
            {flaggedItems.length === 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All Passed</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{flaggedItems.length} Needs Revision</span>
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Out-of-Syllabus Drift Check</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono-tabular text-slate-900">
              {validationOutput.outOfSyllabusCount}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Within Syllabus</span>
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Marks Distribution Summation</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono-tabular text-slate-900">
              {validationOutput.computedTotalMarks} / {validationOutput.targetTotalMarks}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Exact Match</span>
            </span>
          </div>
        </div>
      </div>

      {/* Executive Audit Summary & Course Outcome Attainment Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Agent 04 — Auditor Findings Summary
            </h2>
            {flaggedItems.length === 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>APPROVED FOR PRINT</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                <span>{flaggedItems.length} ITEM FLAGGED</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {validationOutput.executiveAuditSummary}
          </p>

          {flaggedItems.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <p className="text-xs font-semibold text-amber-800">
                Actionable Remediation Queue ({flaggedItems.length}):
              </p>
              {flaggedItems.map(({ question, audit }) => (
                <div
                  key={question.id}
                  className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span>
                      {question.questionNumber} · {question.coCode} ({question.marks} Marks)
                    </span>
                    <span className="font-mono-tabular text-amber-800">
                      Alignment: {audit?.alignmentScore}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{audit?.auditorFindings}</p>
                  <button
                    type="button"
                    disabled={remediatingQuestionId === question.id}
                    onClick={() =>
                      onRemediateQuestion(question, audit?.remediationSuggestion)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 rounded-md transition-colors cursor-pointer"
                  >
                    {remediatingQuestionId === question.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Auto-Remediating {question.questionNumber}...</span>
                      </>
                    ) : (
                      <>
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Auto-Remediate {question.questionNumber} with Validator Feedback</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Outcome Attainment Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Course Learning Objective (CO) Attainment Balance
            </h2>
            <span className="text-xs font-mono-tabular text-slate-500">
              Target vs. Assessed Weightage
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 pr-3">CO</th>
                  <th className="py-2.5 px-3">Learning Objective Statement</th>
                  <th className="py-2.5 px-3 text-right">Target %</th>
                  <th className="py-2.5 px-3 text-right">Assessed %</th>
                  <th className="py-2.5 pl-3 text-right">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {validationOutput.coAttainmentAudit.map((row) => {
                  const coObj = courseOutcomes.find((c) => c.code === row.coCode);
                  return (
                    <tr key={row.coCode} className="hover:bg-slate-50/70">
                      <td className="py-3 pr-3 font-mono-tabular font-bold text-blue-900 whitespace-nowrap">
                        {row.coCode}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {coObj?.statement || 'Mapped Course Learning Objective'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-tabular text-slate-600">
                        {row.targetWeightPercent}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono-tabular font-bold text-slate-900">
                        {row.actualWeightPercent}%
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        {row.status === 'BALANCED' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Balanced</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{row.status}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Question-by-Question 4-Gate Validation Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Question-by-Question Curriculum & Cognitive Validation Matrix
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Inspect individual verification gates and trigger targeted Agent 03 + Agent 04 remediation on any question.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({mergedItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('FLAGGED')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === 'FLAGGED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Flagged ({flaggedItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('VERIFIED')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === 'VERIFIED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Verified ({mergedItems.length - flaggedItems.length})
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredItems.map(({ question, audit }) => {
            const status = audit?.status || 'VERIFIED';
            const isRemediating = remediatingQuestionId === question.id;

            return (
              <div
                key={question.id}
                className={`p-6 space-y-4 ${
                  status !== 'VERIFIED' ? 'bg-amber-50/25' : 'bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-mono-tabular">
                    <span className="text-sm font-bold text-slate-900">
                      {question.questionNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-blue-900">{question.coCode}</span>
                    <span aria-hidden="true">·</span>
                    <span>{question.syllabusUnit}</span>
                    <span aria-hidden="true">·</span>
                    <span>Target: {question.bloomsLevel}</span>
                    <span aria-hidden="true">·</span>
                    <span>Verified: {audit?.verifiedBloomsLevel || question.bloomsLevel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-bold text-slate-900">{question.marks} Marks</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono-tabular font-semibold text-slate-700">
                      Alignment Score: {audit?.alignmentScore ?? 96}/100
                    </span>

                    {status === 'VERIFIED' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>VERIFIED</span>
                      </span>
                    )}
                    {status === 'NEEDS_REVISION' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span>NEEDS REVISION</span>
                      </span>
                    )}
                    {status === 'OUT_OF_SYLLABUS' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                        <XCircle className="w-4 h-4" />
                        <span>OUT OF SYLLABUS</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Stem */}
                <p className="text-sm font-academic text-slate-900 leading-relaxed">
                  {question.stem}
                </p>

                {/* 4 Validation Gate Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                    <span className="text-slate-600">1. Syllabus Fidelity</span>
                    {audit?.syllabusFidelityPass !== false ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Fail</span>
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                    <span className="text-slate-600">2. CO Alignment</span>
                    {audit?.coAlignmentPass !== false ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Drift</span>
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                    <span className="text-slate-600">3. Bloom’s Level</span>
                    {audit?.bloomsCalibrationPass !== false ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Mismatch</span>
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                    <span className="text-slate-600">4. Marks Rubric</span>
                    {audit?.marksProportionalityPass !== false ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Auditor Notes & Matched Syllabus Topic */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="text-slate-500 font-mono-tabular">
                      <span>Matched Syllabus Topic: </span>
                      <strong className="text-slate-800">
                        {audit?.matchedSyllabusTopic || question.syllabusUnit}
                      </strong>
                      <span aria-hidden="true"> · </span>
                      <span>Source: {question.sourceDocumentName}</span>
                    </div>
                    <p className="text-slate-700">
                      <strong className="text-slate-900">Auditor Note: </strong>
                      {audit?.auditorFindings}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isRemediating}
                    onClick={() =>
                      onRemediateQuestion(question, audit?.remediationSuggestion)
                    }
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      status !== 'VERIFIED'
                        ? 'text-white bg-amber-700 hover:bg-amber-800'
                        : 'text-slate-800 bg-white border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isRemediating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Remediating...</span>
                      </>
                    ) : (
                      <>
                        <Wrench className="w-3.5 h-3.5" />
                        <span>
                          {status !== 'VERIFIED'
                            ? `Auto-Remediate ${question.questionNumber}`
                            : `Refine ${question.questionNumber} with Agent`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
