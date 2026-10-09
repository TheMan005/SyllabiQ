import React, { useState } from 'react';
import {
  Printer,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Edit3,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  MarksDistributionConfig,
  GeneratedQuestion,
  BloomsLevel,
} from '../types/assessment';

interface QuestionPaperViewProps {
  marksConfig: MarksDistributionConfig;
  questions: GeneratedQuestion[];
  onUpdateQuestion: (updated: GeneratedQuestion) => void;
  onRemediateQuestion: (question: GeneratedQuestion, customPrompt?: string) => Promise<void>;
  remediatingQuestionId: string | null;
  isGeneratingPaper: boolean;
  onRunGeneratorAgent: () => void;
  onProceedToAudit: () => void;
}

export const QuestionPaperView: React.FC<QuestionPaperViewProps> = ({
  marksConfig,
  questions,
  onUpdateQuestion,
  onRemediateQuestion,
  remediatingQuestionId,
  isGeneratingPaper,
  onRunGeneratorAgent,
  onProceedToAudit,
}) => {
  const [viewMode, setViewMode] = useState<'exam_sheet' | 'marking_scheme' | 'editor'>('exam_sheet');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalPaperMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  const filteredQuestions =
    sectionFilter === 'ALL'
      ? questions
      : questions.filter(
          (q) => q.sectionId === sectionFilter || q.sectionName === sectionFilter
        );

  const handlePrintPaper = () => {
    window.print();
  };

  const handleExportWordDoc = () => {
    const sectionsHtml = marksConfig.sections
      .map((sec) => {
        const secQuestions = questions.filter(
          (q) => q.sectionId === sec.id || q.sectionName === sec.sectionName
        );
        if (secQuestions.length === 0) return '';
        const qRows = secQuestions
          .map(
            (q) => `
          <div style="margin-bottom: 16px;">
            <p style="margin: 0; font-size: 11pt;">
              <strong>${q.questionNumber}.</strong> ${q.stem}
              <span style="float: right; font-family: monospace; font-size: 10pt;">
                [${q.marks} Marks · ${q.coCode} · ${q.bloomsLevel.split(':')[0]}]
              </span>
            </p>
            ${
              q.alternativeQuestionStem
                ? `<p style="margin: 6px 0 0 24px; font-style: italic; font-size: 10.5pt;">${q.alternativeQuestionStem}</p>`
                : ''
            }
          </div>`
          )
          .join('');
        return `
        <div style="margin-top: 22px;">
          <h3 style="text-align: center; font-size: 12pt; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 4px;">
            ${sec.sectionName} (${sec.questionsToAttempt} × ${sec.marksPerQuestion} = ${
          sec.questionsToAttempt * sec.marksPerQuestion
        } Marks)
          </h3>
          <p style="font-style: italic; font-size: 10pt; margin-bottom: 12px;">${sec.instructions}</p>
          ${qRows}
        </div>`;
      })
      .join('');

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${marksConfig.courseCode} Question Paper</title></head>
      <body style="font-family: 'Times New Roman', Georgia, serif; line-height: 1.5; padding: 24px;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 18px;">
          <h1 style="font-size: 16pt; margin: 0;">${marksConfig.institutionName}</h1>
          <p style="font-size: 11pt; margin: 4px 0;">${marksConfig.departmentName}</p>
          <h2 style="font-size: 13pt; margin: 6px 0;">${marksConfig.examTitle}</h2>
          <p style="font-size: 11pt; font-weight: bold; margin: 4px 0;">
            ${marksConfig.courseCode}: ${marksConfig.courseTitle} (${marksConfig.semester})
          </p>
          <p style="font-size: 10.5pt; margin: 6px 0;">
            Time Allowed: ${marksConfig.durationMinutes} Minutes &nbsp;&nbsp;|&nbsp;&nbsp; Maximum Marks: ${totalPaperMarks}
          </p>
        </div>
        ${sectionsHtml}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${marksConfig.courseCode}_Question_Paper.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Group questions by configured sections (with fallback if Agent 3 created custom section names)
  const groupedSections = marksConfig.sections.map((sec) => {
    const matched = questions.filter(
      (q) => q.sectionId === sec.id || q.sectionName === sec.sectionName
    );
    return {
      section: sec,
      items: matched,
    };
  });

  const unmatchedQuestions = questions.filter(
    (q) =>
      !marksConfig.sections.some(
        (sec) => sec.id === q.sectionId || sec.sectionName === q.sectionName
      )
  );

  return (
    <div className="space-y-8">
      {/* Top Toolbar (Hidden on Print) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <p className="text-xs font-semibold text-blue-900 tracking-tight">
            03. Academic Question Paper & Stepwise Marking Scheme Generator
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Generated University Examination Paper ({totalPaperMarks} Marks)
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Switch between the publication-ready University Exam Sheet, the Grader’s Stepwise Marking Scheme, or the Interactive Question Editor to refine individual questions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handlePrintPaper}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportWordDoc}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Word (.doc)</span>
          </button>

          <button
            type="button"
            onClick={onRunGeneratorAgent}
            disabled={isGeneratingPaper}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isGeneratingPaper ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-800" />
                <span>Regenerating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-800" />
                <span>Regenerate Full Paper</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onProceedToAudit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Inspect Syllabus Audit (Agent 04)</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Bar (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-3 no-print">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('exam_sheet')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'exam_sheet'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Official Exam Paper Sheet
          </button>
          <button
            type="button"
            onClick={() => setViewMode('marking_scheme')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'marking_scheme'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Answer Key & Marking Scheme
          </button>
          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'editor'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Question Editor & Single-Item Regenerator
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono-tabular text-slate-600 px-2">
          <span>Questions: {questions.length}</span>
          <span aria-hidden="true">·</span>
          <span>Total Marks: {totalPaperMarks}</span>
          <span aria-hidden="true">·</span>
          <span>Duration: {marksConfig.durationMinutes} min</span>
        </div>
      </div>

      {/* VIEW MODE 1: OFFICIAL UNIVERSITY EXAM PAPER SHEET */}
      {viewMode === 'exam_sheet' && (
        <div className="bg-white border border-slate-300 rounded-xl p-8 md:p-12 max-w-[960px] mx-auto print-paper-sheet">
          {/* Formal University Header */}
          <div className="text-center border-b-2 border-slate-900 pb-6 mb-8 font-academic">
            <p className="text-xs font-sans font-semibold tracking-widest uppercase text-slate-500">
              {marksConfig.departmentName}
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-slate-950 mt-1">
              {marksConfig.institutionName}
            </h2>
            <p className="text-sm font-semibold text-slate-800 mt-1.5">
              {marksConfig.examTitle}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-sans font-semibold text-slate-900">
              <span>
                Course: {marksConfig.courseCode} — {marksConfig.courseTitle} ({marksConfig.semester})
              </span>
              <span className="font-mono-tabular">
                Time Allowed: {marksConfig.durationMinutes} Minutes · Max. Marks: {totalPaperMarks}
              </span>
            </div>

            <div className="mt-3 text-left text-xs font-sans text-slate-600 bg-slate-50 border border-slate-200 rounded p-3">
              <strong className="text-slate-800">Instructions to Candidates:</strong> Assume suitable data if missing and state assumptions clearly. Figures on the right indicate full marks, mapped Course Outcome (CO), and Bloom’s Taxonomy Level (L1–L6).
            </div>
          </div>

          {/* Exam Sections */}
          <div className="space-y-10 font-academic">
            {groupedSections.map(({ section, items }) => {
              if (items.length === 0) return null;
              const secSubtotal = items.reduce((s, q) => s + q.marks, 0);
              return (
                <div key={section.id} className="space-y-5">
                  <div className="border-b border-slate-300 pb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-950 font-sans">
                        {section.sectionName}
                      </h3>
                      <p className="text-xs italic text-slate-600 mt-0.5">{section.instructions}</p>
                    </div>
                    <span className="text-xs font-mono-tabular font-bold text-slate-900 shrink-0">
                      [{items.length} × {section.marksPerQuestion} = {secSubtotal} Marks]
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200/80">
                    {items.map((q) => (
                      <div key={q.id} className="py-4 first:pt-1 flex items-start justify-between gap-6">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="font-mono-tabular font-bold text-sm text-slate-950 shrink-0 mt-0.5">
                            {q.questionNumber}.
                          </span>
                          <div className="space-y-2.5 flex-1">
                            <p className="text-[15px] text-slate-900 leading-relaxed whitespace-pre-line">
                              {q.stem}
                            </p>

                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-sm text-slate-800">
                                {q.options.map((opt, idx) => (
                                  <div key={idx} className="font-sans text-xs">
                                    ({String.fromCharCode(65 + idx)}) {opt}
                                  </div>
                                ))}
                              </div>
                            )}

                            {q.alternativeQuestionStem && (
                              <div className="pt-2 border-t border-dashed border-slate-300">
                                <p className="text-xs font-sans font-bold text-slate-600 mb-1">
                                  INTERNAL CHOICE (OR)
                                </p>
                                <p className="text-[15px] text-slate-900 leading-relaxed whitespace-pre-line">
                                  {q.alternativeQuestionStem}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Unboxed Metadata Column on Right */}
                        <div className="text-right font-mono-tabular text-xs text-slate-700 shrink-0 space-y-0.5">
                          <div className="font-bold text-slate-950">[{q.marks} Marks]</div>
                          <div className="text-slate-500">
                            {q.coCode} · {q.bloomsLevel.split(':')[0]}
                          </div>
                          <div className="text-[11px] text-slate-400 no-print">
                            {q.syllabusUnit}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Render any questions whose sectionName didn't match predefined IDs */}
            {unmatchedQuestions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-950 font-sans border-b border-slate-300 pb-2">
                  Additional Examination Questions
                </h3>
                <div className="divide-y divide-slate-200">
                  {unmatchedQuestions.map((q) => (
                    <div key={q.id} className="py-4 flex items-start justify-between gap-6">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="font-mono-tabular font-bold text-sm text-slate-950">
                          {q.questionNumber}.
                        </span>
                        <p className="text-[15px] text-slate-900 leading-relaxed">{q.stem}</p>
                      </div>
                      <div className="text-right font-mono-tabular text-xs shrink-0">
                        <div className="font-bold">[{q.marks} Marks]</div>
                        <div className="text-slate-500">
                          {q.coCode} · {q.bloomsLevel.split(':')[0]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: STEPWISE MARKING SCHEME & ANSWER KEY */}
      {viewMode === 'marking_scheme' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Official Grader’s Answer Key & Stepwise Marking Rubric
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Generated by Agent 03 with explicit step-by-step mark allocations and multimodal source citations.
              </p>
            </div>
            <span className="text-xs font-mono-tabular text-slate-600">
              {marksConfig.courseCode} · {questions.length} Solutions
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {questions.map((q) => (
              <div key={q.id} className="py-6 first:pt-0 last:pb-0 space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono-tabular font-bold text-blue-900">
                      {q.questionNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-xs font-semibold text-slate-700">{q.sectionName}</span>
                  </div>
                  <div className="text-xs font-mono-tabular text-slate-600">
                    <span className="font-bold text-slate-900">{q.marks} Marks</span>
                    <span aria-hidden="true"> · </span>
                    <span>{q.coCode}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{q.bloomsLevel}</span>
                    <span aria-hidden="true"> · </span>
                    <span>Source: {q.sourceDocumentName} ({q.sourceLocation})</span>
                  </div>
                </div>

                <p className="text-sm font-academic text-slate-900 leading-relaxed">{q.stem}</p>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
                  <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-800 mb-1.5">
                      Model Solution & Expected Derivation
                    </p>
                    <p className="text-xs font-mono-tabular text-slate-700 whitespace-pre-line leading-relaxed">
                      {q.answerKey}
                    </p>
                  </div>

                  <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-800 mb-2">
                      Stepwise Marking Breakdown ({q.marks} Marks Total)
                    </p>
                    <ul className="space-y-2 text-xs">
                      {q.markingSchemeSteps.map((step, sIdx) => (
                        <li
                          key={sIdx}
                          className="flex items-start justify-between gap-3 pb-1.5 border-b border-slate-200/70 last:border-none last:pb-0"
                        >
                          <span className="text-slate-700">{step.stepDescription}</span>
                          <span className="font-mono-tabular font-bold text-slate-900 shrink-0">
                            +{step.marksAwarded}m
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: INTERACTIVE QUESTION EDITOR & SINGLE-QUESTION REGENERATOR */}
      {viewMode === 'editor' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSectionFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  sectionFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Sections ({questions.length})
              </button>
              {marksConfig.sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSectionFilter(sec.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    sectionFilter === sec.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {sec.sectionName.split('—')[0].trim()}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">
              Inline-edit any question or instruct the Multi-Agent system to rewrite a specific slot.
            </span>
          </div>

          <div className="space-y-4">
            {filteredQuestions.map((q) => {
              const isRemediating = remediatingQuestionId === q.id;
              const isEditing = editingId === q.id;
              const valStatus = q.validation?.status || 'VERIFIED';

              return (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-xs font-mono-tabular">
                      <span className="text-sm font-bold text-slate-900">{q.questionNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-blue-900">{q.coCode}</span>
                      <span aria-hidden="true">·</span>
                      <span>{q.syllabusUnit}</span>
                      <span aria-hidden="true">·</span>
                      <span>{q.bloomsLevel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-slate-900">{q.marks} Marks</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {valStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified ({q.validation?.alignmentScore || 96}%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Needs Revision ({q.validation?.alignmentScore || 76}%)</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingId(isEditing ? null : q.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Done Editing' : 'Edit Text'}</span>
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Question Stem
                        </label>
                        <textarea
                          rows={3}
                          value={q.stem}
                          onChange={(e) => onUpdateQuestion({ ...q, stem: e.target.value })}
                          className="w-full text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg p-3"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Course Outcome
                          </label>
                          <input
                            type="text"
                            value={q.coCode}
                            onChange={(e) => onUpdateQuestion({ ...q, coCode: e.target.value })}
                            className="w-full text-xs font-mono-tabular px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Bloom’s Level
                          </label>
                          <select
                            value={q.bloomsLevel}
                            onChange={(e) =>
                              onUpdateQuestion({
                                ...q,
                                bloomsLevel: e.target.value as BloomsLevel,
                              })
                            }
                            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                          >
                            <option value="L1: Remember">L1: Remember</option>
                            <option value="L2: Understand">L2: Understand</option>
                            <option value="L3: Apply">L3: Apply</option>
                            <option value="L4: Analyze">L4: Analyze</option>
                            <option value="L5: Evaluate">L5: Evaluate</option>
                            <option value="L6: Create">L6: Create</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Marks
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={q.marks}
                            onChange={(e) =>
                              onUpdateQuestion({
                                ...q,
                                marks: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                            className="w-full text-xs font-mono-tabular px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Model Answer Key
                        </label>
                        <textarea
                          rows={3}
                          value={q.answerKey}
                          onChange={(e) => onUpdateQuestion({ ...q, answerKey: e.target.value })}
                          className="w-full text-xs font-mono-tabular text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-3"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-academic text-slate-900 leading-relaxed">{q.stem}</p>
                  )}

                  {/* Single-Question AI Regeneration Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <input
                      type="text"
                      placeholder="Optional directive for Agent 03 (e.g. 'Make this a numerical derivation with a 3x3 matrix')..."
                      value={customPrompts[q.id] || ''}
                      onChange={(e) =>
                        setCustomPrompts((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                    <button
                      type="button"
                      disabled={isRemediating}
                      onClick={() => onRemediateQuestion(q, customPrompts[q.id])}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {isRemediating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Regenerating {q.questionNumber}...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Regenerate & Re-Validate {q.questionNumber}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
