import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Plus,
  Sparkles,
  CheckCircle2,
  Eye,
  BookMarked,
  Target,
  Loader2,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';
import {
  UploadedFacultyDocument,
  DocumentFormat,
  CourseOutcome,
  SyllabusUnit,
  IngestionAgentOutput,
  BloomsLevel,
} from '../types/assessment';
import { parseUploadedFileWithFallback } from '../utils/agentClient';

interface DocumentSyllabusStudioProps {
  documents: UploadedFacultyDocument[];
  onAddDocuments: (newDocs: UploadedFacultyDocument[]) => void;
  onRemoveDocument: (id: string) => void;
  courseOutcomes: CourseOutcome[];
  onUpdateCourseOutcomes: (cos: CourseOutcome[]) => void;
  syllabusUnits: SyllabusUnit[];
  onUpdateSyllabusUnits: (units: SyllabusUnit[]) => void;
  ingestionOutput: IngestionAgentOutput;
  isIngesting: boolean;
  onRunIngestionAgent: () => void;
  onProceedToBlueprint: () => void;
}

const ALL_BLOOMS: BloomsLevel[] = [
  'L1: Remember',
  'L2: Understand',
  'L3: Apply',
  'L4: Analyze',
  'L5: Evaluate',
  'L6: Create',
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function detectFormat(fileName: string, mimeType: string): DocumentFormat {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf') || mimeType === 'application/pdf') return 'PDF';
  if (
    lower.endsWith('.pptx') ||
    lower.endsWith('.ppt') ||
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint')
  ) {
    return 'PPTX';
  }
  if (lower.endsWith('.png') || mimeType === 'image/png') return 'PNG';
  return 'JPEG';
}

export const DocumentSyllabusStudio: React.FC<DocumentSyllabusStudioProps> = ({
  documents,
  onAddDocuments,
  onRemoveDocument,
  courseOutcomes,
  onUpdateCourseOutcomes,
  syllabusUnits,
  onUpdateSyllabusUnits,
  ingestionOutput,
  isIngesting,
  onRunIngestionAgent,
  onProceedToBlueprint,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(documents[0]?.id || null);
  const [activeRightPanel, setActiveRightPanel] = useState<'outcomes' | 'syllabus' | 'knowledge'>('knowledge');

  // New Course Outcome form state
  const [newCoCode, setNewCoCode] = useState('');
  const [newCoStatement, setNewCoStatement] = useState('');
  const [newCoWeight, setNewCoWeight] = useState(20);

  // New Syllabus Unit form state
  const [newUnitNum, setNewUnitNum] = useState('');
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newUnitTopics, setNewUnitTopics] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0] || null;

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadingFiles(true);

    const processedDocs: UploadedFacultyDocument[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const format = detectFormat(file.name, file.type);

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const resolvedMime =
        file.type ||
        (format === 'PDF'
          ? 'application/pdf'
          : format === 'PNG'
          ? 'image/png'
          : format === 'JPEG'
          ? 'image/jpeg'
          : 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

      const parsed = await parseUploadedFileWithFallback({
        name: file.name,
        format,
        mimeType: resolvedMime,
        base64Data,
      });
      const pageOrSlideCount = parsed.pageOrSlideCount || 1;
      const extractedTextPreview =
        parsed.extractedTextPreview || `[Uploaded ${format} file: ${file.name}]`;

      const newDoc: UploadedFacultyDocument = {
        id: `doc-${Date.now()}-${i}`,
        name: file.name,
        format,
        mimeType:
          file.type ||
          (format === 'PDF'
            ? 'application/pdf'
            : format === 'PNG'
            ? 'image/png'
            : format === 'JPEG'
            ? 'image/jpeg'
            : 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
        sizeBytes: file.size,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        base64Data,
        extractedTextPreview,
        pageOrSlideCount,
        previewImageUrl: format === 'PNG' || format === 'JPEG' ? base64Data : undefined,
        status: 'READY',
      };
      processedDocs.push(newDoc);
    }

    onAddDocuments(processedDocs);
    if (processedDocs.length > 0) {
      setSelectedDocId(processedDocs[0].id);
    }
    setUploadingFiles(false);
  };

  // Generates a real binary PNG technical diagram on an HTML5 canvas so faculty can test live vision ingestion immediately
  const handleSynthesizeDiagramPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 760;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, 760, 420);

    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 728, 388);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Figure 4.2: Multi-Layer Perceptron & Backpropagation Computational Graph', 36, 52);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#334155';
    ctx.fillText('Forward Pass: z^(l) = W^(l) a^(l-1) + b^(l),   a^(l) = σ(z^(l))', 36, 82);
    ctx.fillText('Backward Error Signal: δ^(l) = ((W^(l+1))^T δ^(l+1)) ⊙ σ\'(z^(l))', 36, 104);
    ctx.fillText('Weight Gradient with L2 Penalty: ∂J/∂W^(l) = δ^(l) (a^(l-1))^T + λ W^(l)', 36, 126);

    // Draw nodes
    const layers = [
      { label: 'Input Layer x_i', x: 120, nodes: [190, 260, 330], color: '#1E3A8A' },
      { label: 'Hidden Layer h^(1)', x: 360, nodes: [170, 230, 290, 350], color: '#0284C7' },
      { label: 'Output Layer y_hat', x: 600, nodes: [220, 300], color: '#059669' },
    ];

    // Draw edges
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    for (const y1 of layers[0].nodes) {
      for (const y2 of layers[1].nodes) {
        ctx.beginPath();
        ctx.moveTo(layers[0].x + 22, y1);
        ctx.lineTo(layers[1].x - 22, y2);
        ctx.stroke();
      }
    }
    for (const y1 of layers[1].nodes) {
      for (const y2 of layers[2].nodes) {
        ctx.beginPath();
        ctx.moveTo(layers[1].x + 22, y1);
        ctx.lineTo(layers[2].x - 22, y2);
        ctx.stroke();
      }
    }

    // Draw circles
    for (const layer of layers) {
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(layer.label, layer.x - 48, 385);
      for (const y of layer.nodes) {
        ctx.beginPath();
        ctx.arc(layer.x, y, 20, 0, Math.PI * 2);
        ctx.fillStyle = layer.color;
        ctx.fill();
      }
    }

    const dataUrl = canvas.toDataURL('image/png');
    const approxBytes = Math.round((dataUrl.length * 3) / 4);
    const newDoc: UploadedFacultyDocument = {
      id: `doc-synth-${Date.now()}`,
      name: 'Backpropagation_Computational_Graph_Figure4_2.png',
      format: 'PNG',
      mimeType: 'image/png',
      sizeBytes: approxBytes,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      base64Data: dataUrl,
      previewImageUrl: dataUrl,
      pageOrSlideCount: 1,
      status: 'READY',
      extractedTextPreview:
        'Figure 4.2: Multi-Layer Perceptron & Backpropagation Computational Graph.\nForward Pass: z^(l) = W^(l) a^(l-1) + b^(l), a^(l) = σ(z^(l)).\nBackward Error Signal: δ^(l) = ((W^(l+1))^T δ^(l+1)) ⊙ σ\'(z^(l)).\nWeight Gradient with L2 Penalty: ∂J/∂W^(l) = δ^(l) (a^(l-1))^T + λ W^(l).',
    };
    onAddDocuments([newDoc]);
    setSelectedDocId(newDoc.id);
  };

  const handleAddCo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoCode.trim() || !newCoStatement.trim()) return;
    const added: CourseOutcome = {
      code: newCoCode.trim().toUpperCase(),
      statement: newCoStatement.trim(),
      targetBlooms: ['L3: Apply', 'L4: Analyze'],
      syllabusUnits: [syllabusUnits[0]?.unitNumber || 'Unit I'],
      weightagePercent: Number(newCoWeight) || 20,
    };
    onUpdateCourseOutcomes([...courseOutcomes, added]);
    setNewCoCode('');
    setNewCoStatement('');
  };

  const handleDeleteCo = (code: string) => {
    onUpdateCourseOutcomes(courseOutcomes.filter((c) => c.code !== code));
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitNum.trim() || !newUnitTitle.trim()) return;
    const topicsList = newUnitTopics
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const added: SyllabusUnit = {
      unitNumber: newUnitNum.trim(),
      title: newUnitTitle.trim(),
      topics: topicsList.length > 0 ? topicsList : [newUnitTitle.trim()],
      contactHours: 10,
      mappedCOs: [courseOutcomes[0]?.code || 'CO1'],
    };
    onUpdateSyllabusUnits([...syllabusUnits, added]);
    setNewUnitNum('');
    setNewUnitTitle('');
    setNewUnitTopics('');
  };

  const handleDeleteUnit = (unitNumber: string) => {
    onUpdateSyllabusUnits(syllabusUnits.filter((u) => u.unitNumber !== unitNumber));
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-semibold text-blue-900 tracking-tight">
            01. Multimodal Curriculum & Document Ingestion Studio
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Faculty Source Materials & Official Syllabus Alignment
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Upload lecture handouts (PDF), presentation slides (PPT/PPTX), whiteboard photographs (JPEG), and textbook diagrams (PNG). Agent 01 extracts concepts, formulas, and visual annotations and maps them to your Syllabus Units and Course Learning Objectives.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onRunIngestionAgent}
            disabled={isIngesting || documents.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isIngesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-800" />
                <span>Running Agent 01...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-800" />
                <span>Re-Analyze Documents (Agent 01)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onProceedToBlueprint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Configure Marks Blueprint</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (5 cols): Multimodal Document Uploader & Inspector */}
        <div className="lg:col-span-5 space-y-6">
          {/* Drag and Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFilesSelected(e.dataTransfer.files);
            }}
            className={`bg-white border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              isDragging
                ? 'border-blue-700 bg-blue-50/40'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-3">
              {uploadingFiles ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-800" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            <h2 className="text-sm font-semibold text-slate-900">
              Drop faculty course files here or browse computer
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Supported formats: PDF textbooks · PPT / PPTX slide decks · JPEG whiteboard photos · PNG diagrams
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Select PDF / PPTX / JPEG / PNG
              </button>
              <button
                type="button"
                onClick={handleSynthesizeDiagramPng}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Add Sample Neural Net Diagram (PNG)</span>
              </button>
            </div>
          </div>

          {/* Uploaded Faculty Documents Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Uploaded Course Corpus ({documents.length})
              </h3>
              <span className="text-xs text-slate-500 font-mono-tabular">
                PDF · PPTX · JPEG · PNG
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-600">No faculty documents uploaded yet.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Upload at least one PDF, PPTX, JPEG, or PNG file above to begin.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {documents.map((doc) => {
                  const isSelected = selectedDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                          <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                        </div>
                        {/* Zero-pill metadata discipline: unboxed text with middot separators */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono-tabular mt-1">
                          <span className="font-semibold text-slate-700">{doc.format}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {doc.pageOrSlideCount || 1}{' '}
                            {doc.format === 'PPTX'
                              ? 'slides'
                              : doc.format === 'PDF'
                              ? 'pages'
                              : 'frame'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{formatBytes(doc.sizeBytes)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{doc.status === 'INGESTED' ? 'Ingested' : 'Ready'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocId(doc.id);
                          }}
                          title="Inspect extracted content"
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveDocument(doc.id);
                          }}
                          title="Remove document"
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Document Content & Multimodal Preview Inspector */}
          {selectedDoc && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Multimodal Document Inspector
                  </p>
                  <h4 className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                    {selectedDoc.name}
                  </h4>
                </div>
                <span className="text-xs font-mono-tabular text-slate-500 shrink-0">
                  {selectedDoc.format} · {formatBytes(selectedDoc.sizeBytes)}
                </span>
              </div>

              {selectedDoc.previewImageUrl && (
                <div className="mt-3 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-2">
                  <img
                    src={selectedDoc.previewImageUrl}
                    alt={selectedDoc.name}
                    referrerPolicy="no-referrer"
                    className="max-h-52 w-auto mx-auto object-contain rounded"
                  />
                </div>
              )}

              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-700 mb-1.5">
                  Extracted Text, Slide Notes & Equation Stream:
                </p>
                <pre className="text-xs font-mono-tabular text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3.5 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                  {selectedDoc.extractedTextPreview || 'Binary payload queued for Gemini multimodal analysis.'}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (7 cols): Segmented Control for Agent 1 Knowledge Digest, Course Outcomes & Syllabus Units */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Segmented Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveRightPanel('knowledge')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeRightPanel === 'knowledge'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Agent 01 Knowledge Graph ({ingestionOutput.extractedConcepts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveRightPanel('outcomes')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeRightPanel === 'outcomes'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Learning Objectives ({courseOutcomes.length} COs)
              </button>
              <button
                type="button"
                onClick={() => setActiveRightPanel('syllabus')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeRightPanel === 'syllabus'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Syllabus Units ({syllabusUnits.length} Units)
              </button>
            </div>

            <span className="text-xs text-slate-500 font-mono-tabular px-2">
              {ingestionOutput.totalDocumentsProcessed} files mapped
            </span>
          </div>

          {/* PANEL 1: AGENT 01 EXTRACTED KNOWLEDGE GRAPH */}
          {activeRightPanel === 'knowledge' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="border-b border-slate-200 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Agent 01 — Multimodal Concept & Formula Digest
                  </h3>
                  <span className="text-xs font-mono-tabular text-emerald-700 font-medium">
                    ● {ingestionOutput.extractedConcepts.length} Concept Clusters Extracted
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {ingestionOutput.summary}
                </p>
              </div>

              {/* Concept Nodes List */}
              <div className="divide-y divide-slate-200">
                {ingestionOutput.extractedConcepts.map((node, index) => (
                  <div key={node.id || index} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        0{index + 1}. {node.topicTitle}
                      </h4>
                      <div className="flex items-center gap-2 text-xs font-mono-tabular text-slate-600">
                        <span className="font-semibold text-blue-900">{node.mappedCO}</span>
                        <span aria-hidden="true">·</span>
                        <span>{node.syllabusUnit}</span>
                        <span aria-hidden="true">·</span>
                        <span>{node. suggestedCognitiveLevels.join(', ')}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 font-mono-tabular mt-1">
                      Source: {node.sourceDocumentName} · {node.sourceLocation}
                    </p>

                    <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-700 mb-1">
                          Extracted Key Concepts
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {node.keyConcepts.join(' · ')}
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-700 mb-1">
                          Formulas & Diagram Annotations
                        </p>
                        <p className="text-xs font-mono-tabular text-slate-800 leading-relaxed">
                          {node.formulasOrDiagrams.join('  |  ')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PANEL 2: COURSE LEARNING OBJECTIVES (CO1 - COn) */}
          {activeRightPanel === 'outcomes' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-900" />
                    <span>Course Learning Objectives (Course Outcomes)</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Agent 04 validates every generated question against these Course Outcomes (COs) and their target Bloom’s levels.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {courseOutcomes.map((co, idx) => (
                  <div key={co.code} className="py-4 first:pt-0 flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 text-xs font-mono-tabular">
                        <span className="font-bold text-blue-900 text-sm">{co.code}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-600">Target Weight: {co.weightagePercent}%</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-600">Units: {co.syllabusUnits.join(', ')}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-600">Bloom’s: {co.targetBlooms.join(', ')}</span>
                      </div>
                      <textarea
                        rows={2}
                        value={co.statement}
                        onChange={(e) => {
                          const updated = [...courseOutcomes];
                          updated[idx] = { ...co, statement: e.target.value };
                          onUpdateCourseOutcomes(updated);
                        }}
                        className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-700"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCo(co.code)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors mt-1"
                      title="Delete Course Outcome"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Course Outcome Form */}
              <form onSubmit={handleAddCo} className="pt-4 border-t border-slate-200 space-y-3">
                <p className="text-xs font-semibold text-slate-800">Add New Learning Objective (CO)</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Code (e.g. CO5)"
                    value={newCoCode}
                    onChange={(e) => setNewCoCode(e.target.value)}
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                  <input
                    type="text"
                    placeholder="Learning objective statement..."
                    value={newCoStatement}
                    onChange={(e) => setNewCoStatement(e.target.value)}
                    className="sm:col-span-2 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={newCoWeight}
                      onChange={(e) => setNewCoWeight(Number(e.target.value))}
                      className="w-20 text-xs font-mono-tabular px-2.5 py-2 border border-slate-300 rounded-lg"
                      title="Target weightage %"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add CO</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* PANEL 3: OFFICIAL SYLLABUS UNITS */}
          {activeRightPanel === 'syllabus' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-blue-900" />
                    <span>Official Course Syllabus Modules</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Defines the strict curriculum boundary. Any generated question falling outside these topics is flagged by Agent 04.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {syllabusUnits.map((unit, idx) => (
                  <div key={unit.unitNumber} className="py-4 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono-tabular font-bold text-blue-900">
                          {unit.unitNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <input
                          type="text"
                          value={unit.title}
                          onChange={(e) => {
                            const updated = [...syllabusUnits];
                            updated[idx] = { ...unit, title: e.target.value };
                            onUpdateSyllabusUnits(updated);
                          }}
                          className="text-sm font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-700 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono-tabular text-slate-500">
                          {unit.contactHours} hrs · Mapped: {unit.mappedCOs.join(', ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteUnit(unit.unitNumber)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={unit.topics.join(' · ')}
                      onChange={(e) => {
                        const updated = [...syllabusUnits];
                        updated[idx] = {
                          ...unit,
                          topics: e.target.value
                            .split(/·|,/)
                            .map((s) => s.trim())
                            .filter(Boolean),
                        };
                        onUpdateSyllabusUnits(updated);
                      }}
                      className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                ))}
              </div>

              {/* Add Syllabus Unit Form */}
              <form onSubmit={handleAddUnit} className="pt-4 border-t border-slate-200 space-y-3">
                <p className="text-xs font-semibold text-slate-800">Add Syllabus Unit</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Unit # (e.g. Unit V)"
                    value={newUnitNum}
                    onChange={(e) => setNewUnitNum(e.target.value)}
                    className="text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Unit Title"
                    value={newUnitTitle}
                    onChange={(e) => setNewUnitTitle(e.target.value)}
                    className="sm:col-span-2 text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Comma-separated syllabus topics..."
                    value={newUnitTopics}
                    onChange={(e) => setNewUnitTopics(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Unit</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
