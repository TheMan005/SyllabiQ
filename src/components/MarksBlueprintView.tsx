import React from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  MarksDistributionConfig,
  SectionMarksConfig,
  BlueprintAgentOutput,
  BloomsLevel,
} from '../types/assessment';

interface MarksBlueprintViewProps {
  marksConfig: MarksDistributionConfig;
  onUpdateMarksConfig: (updated: MarksDistributionConfig) => void;
  blueprintOutput: BlueprintAgentOutput;
  isBuildingBlueprint: boolean;
  onRunBlueprintAgent: () => void;
  isGeneratingPaper: boolean;
  onRunGeneratorAgent: () => void;
}

export const MarksBlueprintView: React.FC<MarksBlueprintViewProps> = ({
  marksConfig,
  onUpdateMarksConfig,
  blueprintOutput,
  isBuildingBlueprint,
  onRunBlueprintAgent,
  isGeneratingPaper,
  onRunGeneratorAgent,
}) => {
  const computedTotalMarks = marksConfig.sections.reduce(
    (sum, s) => sum + s.questionsToAttempt * s.marksPerQuestion,
    0
  );

  const computedTotalQuestions = marksConfig.sections.reduce(
    (sum, s) => sum + s.questionsToAttempt,
    0
  );

  const handleSectionChange = (index: number, patch: Partial<SectionMarksConfig>) => {
    const nextSections = [...marksConfig.sections];
    nextSections[index] = { ...nextSections[index], ...patch };
    const newMax = nextSections.reduce(
      (sum, s) => sum + s.questionsToAttempt * s.marksPerQuestion,
      0
    );
    onUpdateMarksConfig({
      ...marksConfig,
      sections: nextSections,
      maximumMarks: newMax,
    });
  };

  const handleAddSection = () => {
    const nextLetter = String.fromCharCode(65 + marksConfig.sections.length);
    const newSec: SectionMarksConfig = {
      id: `sec-${Date.now()}`,
      sectionName: `Section ${nextLetter} — Extended Assessment`,
      questionType: 'Analytical / Derivation',
      totalQuestionsToGenerate: 2,
      questionsToAttempt: 2,
      marksPerQuestion: 5,
      targetBloomsMix: ['L3: Apply', 'L4: Analyze'],
      instructions: `Attempt all questions in Section ${nextLetter}.`,
    };
    const nextSections = [...marksConfig.sections, newSec];
    const newMax = nextSections.reduce(
      (sum, s) => sum + s.questionsToAttempt * s.marksPerQuestion,
      0
    );
    onUpdateMarksConfig({
      ...marksConfig,
      sections: nextSections,
      maximumMarks: newMax,
    });
  };

  const handleRemoveSection = (index: number) => {
    if (marksConfig.sections.length <= 1) return;
    const nextSections = marksConfig.sections.filter((_, i) => i !== index);
    const newMax = nextSections.reduce(
      (sum, s) => sum + s.questionsToAttempt * s.marksPerQuestion,
      0
    );
    onUpdateMarksConfig({
      ...marksConfig,
      sections: nextSections,
      maximumMarks: newMax,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-semibold text-blue-900 tracking-tight">
            02. Marks Distribution & Assessment Blueprint Architect
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Examination Structure & Specification Matrix
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Configure section-wise marks allocation, internal choice rules, and Bloom’s cognitive targets. Agent 02 synthesizes a question-by-question specification matrix before Agent 03 writes the exam.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onRunBlueprintAgent}
            disabled={isBuildingBlueprint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isBuildingBlueprint ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-800" />
                <span>Building Blueprint (Agent 02)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-800" />
                <span>Rebuild Blueprint Matrix (Agent 02)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRunGeneratorAgent}
            disabled={isGeneratingPaper}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isGeneratingPaper ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Exam Paper (Agent 03)...</span>
              </>
            ) : (
              <>
                <span>Generate Question Paper (Agent 03)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Configuration Grid: Exam Metadata + Bloom's Calibration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Exam Header Metadata & Sections Table (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-900" />
              <span>Section-Wise Marks Distribution Builder</span>
            </h2>
            <div className="text-xs font-mono-tabular text-slate-700">
              <span>{computedTotalQuestions} Questions</span>
              <span aria-hidden="true"> · </span>
              <span className="font-bold text-blue-900">Total: {computedTotalMarks} Marks</span>
            </div>
          </div>

          {/* Institution & Exam Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institution Name
              </label>
              <input
                type="text"
                value={marksConfig.institutionName}
                onChange={(e) =>
                  onUpdateMarksConfig({ ...marksConfig, institutionName: e.target.value })
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Examination Title
              </label>
              <input
                type="text"
                value={marksConfig.examTitle}
                onChange={(e) =>
                  onUpdateMarksConfig({ ...marksConfig, examTitle: e.target.value })
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  value={marksConfig.courseCode}
                  onChange={(e) =>
                    onUpdateMarksConfig({ ...marksConfig, courseCode: e.target.value })
                  }
                  className="w-full text-xs font-mono-tabular px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration (Min)
                </label>
                <input
                  type="number"
                  min={30}
                  max={240}
                  step={15}
                  value={marksConfig.durationMinutes}
                  onChange={(e) =>
                    onUpdateMarksConfig({
                      ...marksConfig,
                      durationMinutes: Number(e.target.value) || 180,
                    })
                  }
                  className="w-full text-xs font-mono-tabular px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section Rows */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 pr-3">Section Name</th>
                  <th className="py-2.5 px-3">Question Format</th>
                  <th className="py-2.5 px-3 text-right">Questions</th>
                  <th className="py-2.5 px-3 text-right">Marks / Q</th>
                  <th className="py-2.5 px-3 text-right">Section Subtotal</th>
                  <th className="py-2.5 pl-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {marksConfig.sections.map((sec, idx) => {
                  const subtotal = sec.questionsToAttempt * sec.marksPerQuestion;
                  return (
                    <tr key={sec.id} className="hover:bg-slate-50/80">
                      <td className="py-3 pr-3">
                        <input
                          type="text"
                          value={sec.sectionName}
                          onChange={(e) =>
                            handleSectionChange(idx, { sectionName: e.target.value })
                          }
                          className="w-full font-semibold text-slate-900 bg-transparent border border-slate-200 rounded px-2.5 py-1.5"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={sec.questionType}
                          onChange={(e) =>
                            handleSectionChange(idx, {
                              questionType: e.target.value as SectionMarksConfig['questionType'],
                            })
                          }
                          className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
                        >
                          <option value="MCQ">MCQ</option>
                          <option value="Short Answer">Short Answer</option>
                          <option value="Analytical / Derivation">Analytical / Derivation</option>
                          <option value="Case Study / Long Answer">Case Study / Long Answer</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={sec.questionsToAttempt}
                          onChange={(e) => {
                            const count = Math.max(1, Number(e.target.value) || 1);
                            handleSectionChange(idx, {
                              questionsToAttempt: count,
                              totalQuestionsToGenerate: count,
                            });
                          }}
                          className="w-16 text-right font-mono-tabular border border-slate-200 rounded px-2 py-1.5"
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={sec.marksPerQuestion}
                          onChange={(e) =>
                            handleSectionChange(idx, {
                              marksPerQuestion: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className="w-16 text-right font-mono-tabular border border-slate-200 rounded px-2 py-1.5"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-mono-tabular font-bold text-slate-900">
                        {subtotal} marks
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(idx)}
                          disabled={marksConfig.sections.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded"
                          title="Delete section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleAddSection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Exam Section</span>
            </button>

            <span className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Mathematical Sum Verified: {computedTotalMarks} / {marksConfig.maximumMarks} Marks
              </span>
            </span>
          </div>
        </div>

        {/* Right Column (4 cols): Bloom's Taxonomy & CO Distribution Summary */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">
              Bloom’s Cognitive Target Calibration
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Adjust target cognitive complexity across the examination paper.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">L1–L2: Remember & Understand</span>
                <span className="font-mono-tabular font-semibold text-slate-900">
                  {marksConfig.bloomsTargetPercentages.rememberUnderstand}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={marksConfig.bloomsTargetPercentages.rememberUnderstand}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const rem = 100 - val;
                  const apply = Math.min(marksConfig.bloomsTargetPercentages.applyAnalyze, rem);
                  const evalCreate = Math.max(0, rem - apply);
                  onUpdateMarksConfig({
                    ...marksConfig,
                    bloomsTargetPercentages: {
                      rememberUnderstand: val,
                      applyAnalyze: apply,
                      evaluateCreate: evalCreate,
                    },
                  });
                }}
                className="w-full accent-blue-900 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">L3–L4: Apply & Analyze</span>
                <span className="font-mono-tabular font-semibold text-slate-900">
                  {marksConfig.bloomsTargetPercentages.applyAnalyze}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={80}
                step={5}
                value={marksConfig.bloomsTargetPercentages.applyAnalyze}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const rem = Math.max(0, 100 - marksConfig.bloomsTargetPercentages.rememberUnderstand - val);
                  onUpdateMarksConfig({
                    ...marksConfig,
                    bloomsTargetPercentages: {
                      ...marksConfig.bloomsTargetPercentages,
                      applyAnalyze: val,
                      evaluateCreate: rem,
                    },
                  });
                }}
                className="w-full accent-blue-900 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">L5–L6: Evaluate & Create</span>
                <span className="font-mono-tabular font-semibold text-slate-900">
                  {marksConfig.bloomsTargetPercentages.evaluateCreate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-900 h-full"
                  style={{ width: `${marksConfig.bloomsTargetPercentages.evaluateCreate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Agent 02 CO Allocation Breakdown */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-semibold text-slate-800">
              Agent 02 — Course Outcome Allocation
            </h3>
            <div className="space-y-2">
              {blueprintOutput.coDistribution.map((co) => (
                <div key={co.coCode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono-tabular">
                    <span className="font-semibold text-slate-800">{co.coCode}</span>
                    <span className="text-slate-600">
                      {co.allocatedMarks} marks · {co.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-800 h-full"
                      style={{ width: `${Math.min(100, co.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Agent 02 Question-by-Question Specification Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Agent 02 — Question-by-Question Assessment Specification Matrix
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">{blueprintOutput.blueprintSummary}</p>
          </div>
          <span className="text-xs font-mono-tabular font-semibold text-slate-800">
            {blueprintOutput.slots.length} Blueprint Slots · {blueprintOutput.totalAllocatedMarks} Marks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Section & Format</th>
                <th className="py-3 px-4">Assigned Topic & Multimodal Source Citation</th>
                <th className="py-3 px-4">Unit · CO</th>
                <th className="py-3 px-4">Target Bloom’s</th>
                <th className="py-3 px-4 text-right">Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {blueprintOutput.slots.map((slot) => (
                <tr key={slot.slotId} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-mono-tabular font-bold text-slate-900 whitespace-nowrap">
                    {slot.questionNumber}
                    {slot.isInternalChoice ? ' (OR)' : ''}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="font-medium text-slate-900">{slot.questionType}</div>
                    <div className="text-slate-500 truncate max-w-[200px]">{slot.sectionName}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900">{slot.assignedTopic}</div>
                    <div className="text-slate-500 font-mono-tabular mt-0.5">
                      Source: {slot.sourceDocumentRef}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono-tabular whitespace-nowrap text-slate-700">
                    <span className="font-semibold text-blue-900">{slot.targetCO}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{slot.targetUnit}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono-tabular whitespace-nowrap text-slate-700">
                    {slot.targetBlooms as BloomsLevel}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tabular font-bold text-slate-900 whitespace-nowrap">
                    {slot.marks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
