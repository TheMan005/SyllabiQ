import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import JSZip from 'jszip';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ExtractedPptxResult {
  slideCount: number;
  extractedText: string;
  embeddedImages: { mimeType: string; data: string }[];
}

async function parsePptxBase64(base64Data: string, fileName: string): Promise<ExtractedPptxResult> {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const zip = await JSZip.loadAsync(buffer);

    const slideFiles = Object.keys(zip.files)
      .filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
        const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
        return numA - numB;
      });

    const slidesOutput: string[] = [];
    for (let i = 0; i < slideFiles.length; i++) {
      const slideKey = slideFiles[i];
      const xmlContent = await zip.files[slideKey].async('string');
      const textMatches = Array.from(xmlContent.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)).map((m) =>
        m[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim()
      );
      const cleanLines = textMatches.filter((t) => t.length > 0);
      if (cleanLines.length > 0) {
        slidesOutput.push(`--- Slide ${i + 1} ---\n${cleanLines.join(' ')}`);
      }
    }

    // Also extract speaker notes if present
    const noteFiles = Object.keys(zip.files)
      .filter((k) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(k))
      .sort();
    for (let i = 0; i < noteFiles.length; i++) {
      const xmlContent = await zip.files[noteFiles[i]].async('string');
      const noteMatches = Array.from(xmlContent.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g))
        .map((m) => m[1].trim())
        .filter((t) => t.length > 0);
      if (noteMatches.length > 0 && slidesOutput[i]) {
        slidesOutput[i] += `\n[Speaker Notes]: ${noteMatches.join(' ')}`;
      }
    }

    // Also extract up to 4 embedded images from ppt/media/
    const mediaFiles = Object.keys(zip.files)
      .filter((k) => /^ppt\/media\/.*\.(png|jpg|jpeg)$/i.test(k))
      .slice(0, 4);

    const embeddedImages: { mimeType: string; data: string }[] = [];
    for (const mediaKey of mediaFiles) {
      const imgBase64 = await zip.files[mediaKey].async('base64');
      const ext = mediaKey.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      embeddedImages.push({ mimeType: ext, data: imgBase64 });
    }

    return {
      slideCount: slideFiles.length || 1,
      extractedText:
        slidesOutput.join('\n\n') ||
        `[Presentation ${fileName}: ${slideFiles.length} slides processed]`,
      embeddedImages,
    };
  } catch {
    // Fallback for legacy binary .ppt or non-zip files
    const rawBuffer = Buffer.from(base64Data, 'base64');
    const printable = rawBuffer
      .toString('utf8')
      .replace(/[^\x20-\x7E\n\r]/g, ' ')
      .replace(/\s{3,}/g, ' ')
      .slice(0, 6000);
    return {
      slideCount: 1,
      extractedText: `[Extracted Presentation Text from ${fileName}]:\n${printable}`,
      embeddedImages: [],
    };
  }
}

interface IncomingDoc {
  id: string;
  name: string;
  format: string;
  mimeType: string;
  base64Data?: string;
  extractedTextPreview?: string;
}

async function buildMultimodalParts(documents: IncomingDoc[]) {
  const parts: any[] = [];
  for (const doc of documents) {
    const cleanBase64 = doc.base64Data?.includes(',')
      ? doc.base64Data.split(',')[1]
      : doc.base64Data;

    if (
      cleanBase64 &&
      (doc.mimeType === 'application/pdf' ||
        doc.mimeType === 'image/png' ||
        doc.mimeType === 'image/jpeg' ||
        doc.mimeType === 'image/jpg' ||
        doc.mimeType === 'image/webp')
    ) {
      parts.push({
        inlineData: {
          mimeType: doc.mimeType === 'image/jpg' ? 'image/jpeg' : doc.mimeType,
          data: cleanBase64,
        },
      });
      parts.push({
        text: `[Uploaded Multimodal Document: "${doc.name}" (${doc.format}) — see attached binary inlineData above.${
          doc.extractedTextPreview ? ` Additional context: ${doc.extractedTextPreview}` : ''
        }]`,
      });
    } else if (
      cleanBase64 &&
      (doc.format === 'PPTX' ||
        doc.name.toLowerCase().endsWith('.pptx') ||
        doc.name.toLowerCase().endsWith('.ppt') ||
        doc.mimeType.includes('presentation') ||
        doc.mimeType.includes('powerpoint'))
    ) {
      const parsedPpt = await parsePptxBase64(cleanBase64, doc.name);
      parts.push({
        text: `[Uploaded PowerPoint Deck: "${doc.name}" (${parsedPpt.slideCount} slides)]\n${parsedPpt.extractedText}`,
      });
      for (const img of parsedPpt.embeddedImages) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data,
          },
        });
      }
    } else if (doc.extractedTextPreview) {
      parts.push({
        text: `[Uploaded Faculty Document: "${doc.name}" (${doc.format})]\n${doc.extractedTextPreview}`,
      });
    }
  }
  return parts;
}

// Endpoint to inspect & parse a newly uploaded file immediately
app.post('/api/agents/parse-file', async (req: Request, res: Response) => {
  try {
    const { name, format, mimeType, base64Data } = req.body;
    if (!base64Data) {
      res.status(400).json({ error: 'Missing base64Data for file parsing.' });
      return;
    }
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    if (
      format === 'PPTX' ||
      name?.toLowerCase().endsWith('.pptx') ||
      name?.toLowerCase().endsWith('.ppt')
    ) {
      const parsed = await parsePptxBase64(cleanBase64, name);
      res.json({
        pageOrSlideCount: parsed.slideCount,
        extractedTextPreview: parsed.extractedText.slice(0, 2500),
      });
      return;
    }

    if (mimeType === 'application/pdf') {
      // Estimate PDF page count from /Type /Page occurrences in buffer
      const rawStr = Buffer.from(cleanBase64, 'base64').toString('latin1');
      const matches = rawStr.match(/\/Type\s*\/Page\b/g);
      const pageCount = matches ? Math.max(1, matches.length) : 1;
      res.json({
        pageOrSlideCount: pageCount,
        extractedTextPreview: `[PDF Binary Document Ready for Gemini Multimodal Vision & Text Ingestion — ${pageCount} page(s) detected in ${name}]`,
      });
      return;
    }

    res.json({
      pageOrSlideCount: 1,
      extractedTextPreview: `[High-Resolution ${format} Visual Asset Ready for Gemini Multimodal Vision Ingestion: ${name}]`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to parse uploaded document.' });
  }
});

// AGENT 1: Multimodal Document Ingestion & Concept Extraction Agent
app.post('/api/agents/ingest', async (req: Request, res: Response) => {
  try {
    const { documents, syllabusUnits, courseOutcomes } = req.body;
    const ai = getAiClient();
    const multimodalParts = await buildMultimodalParts(documents || []);

    const prompt = `You are Agent 1: Multimodal Curriculum & Document Ingestion Agent in a university assessment generation system.
Analyze all provided faculty course materials (PDF handouts, PPTX lecture slides, JPEG whiteboard photos, PNG diagrams) and map their technical concepts, equations, and figures to the official Syllabus Units and Course Learning Objectives (COs).

Official Syllabus Units:
${JSON.stringify(syllabusUnits, null, 2)}

Official Course Learning Objectives (Course Outcomes):
${JSON.stringify(courseOutcomes, null, 2)}

Instructions:
1. Extract 5 to 8 rich, concrete technical concept clusters from the provided documents.
2. For each concept cluster, cite the exact source document name and specific slide/page/diagram location.
3. Extract actual mathematical formulas, reactions, laws, or structural components present in the source material.
4. Compute unit-by-unit coverage and identify any syllabus topics not strongly covered by the uploaded files.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [...multimodalParts, { text: prompt }],
      },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            totalDocumentsProcessed: { type: Type.INTEGER },
            extractedConcepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  topicTitle: { type: Type.STRING },
                  syllabusUnit: { type: Type.STRING },
                  mappedCO: { type: Type.STRING },
                  sourceDocumentName: { type: Type.STRING },
                  sourceLocation: { type: Type.STRING },
                  keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                  formulasOrDiagrams: { type: Type.ARRAY, items: { type: Type.STRING } },
                  suggestedCognitiveLevels: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                  'id',
                  'topicTitle',
                  'syllabusUnit',
                  'mappedCO',
                  'sourceDocumentName',
                  'sourceLocation',
                  'keyConcepts',
                  'formulasOrDiagrams',
                  'suggestedCognitiveLevels',
                ],
              },
            },
            coverageByUnit: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  unitNumber: { type: Type.STRING },
                  conceptCount: { type: Type.INTEGER },
                  sourceFiles: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['unitNumber', 'conceptCount', 'sourceFiles'],
              },
            },
            unmatchedSyllabusTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'summary',
            'totalDocumentsProcessed',
            'extractedConcepts',
            'coverageByUnit',
            'unmatchedSyllabusTopics',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Agent 1 (Ingest) Error:', err);
    res.status(500).json({ error: err.message || 'Agent 1 failed to ingest documents.' });
  }
});

// AGENT 2: Assessment Blueprint & Marks Distribution Architect Agent
app.post('/api/agents/blueprint', async (req: Request, res: Response) => {
  try {
    const { ingestionOutput, marksConfig, courseOutcomes, syllabusUnits } = req.body;
    const ai = getAiClient();

    // Calculate exact expected slots from marksConfig.sections
    const sectionsSummary = (marksConfig.sections || [])
      .map(
        (s: any, idx: number) =>
          `Section ${idx + 1} (${s.id} - "${s.sectionName}"): Generate ${s.questionsToAttempt} question slots, each worth ${s.marksPerQuestion} marks (Subtotal = ${
            s.questionsToAttempt * s.marksPerQuestion
          } marks), Question Type: ${s.questionType}, Target Bloom's: ${(s.targetBloomsMix || []).join(', ')}. Internal Choice: ${
            s.totalQuestionsToGenerate > s.questionsToAttempt ? 'Yes' : 'No'
          }.`
      )
      .join('\n');

    const prompt = `You are Agent 2: Assessment Blueprint & Marks Distribution Architect Agent.
Design a formal question-by-question Assessment Specification Matrix (Blueprint) that strictly satisfies the faculty's Marks Distribution Configuration and balances coverage across Course Learning Objectives (COs) and Syllabus Units.

Extracted Knowledge Digest from Agent 1:
${JSON.stringify(ingestionOutput, null, 2)}

Course Outcomes (COs):
${JSON.stringify(courseOutcomes, null, 2)}

Syllabus Units:
${JSON.stringify(syllabusUnits, null, 2)}

Faculty Marks Distribution Configuration (Target Total Marks = ${marksConfig.maximumMarks}):
${sectionsSummary}

Target Bloom's Taxonomy Split:
- L1-L2 (Remember & Understand): ${marksConfig.bloomsTargetPercentages?.rememberUnderstand || 20}%
- L3-L4 (Apply & Analyze): ${marksConfig.bloomsTargetPercentages?.applyAnalyze || 50}%
- L5-L6 (Evaluate & Create): ${marksConfig.bloomsTargetPercentages?.evaluateCreate || 30}%

CRITICAL MATH RULE:
The sum of 'marks' across all slots in 'slots' MUST equal ${marksConfig.maximumMarks}.
Use one of these exact strings for 'targetBlooms': 'L1: Remember', 'L2: Understand', 'L3: Apply', 'L4: Analyze', 'L5: Evaluate', 'L6: Create'.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            blueprintSummary: { type: Type.STRING },
            totalAllocatedMarks: { type: Type.NUMBER },
            totalQuestionsCount: { type: Type.INTEGER },
            coDistribution: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  coCode: { type: Type.STRING },
                  allocatedMarks: { type: Type.NUMBER },
                  percentage: { type: Type.NUMBER },
                },
                required: ['coCode', 'allocatedMarks', 'percentage'],
              },
            },
            bloomsDistribution: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  level: { type: Type.STRING },
                  allocatedMarks: { type: Type.NUMBER },
                  percentage: { type: Type.NUMBER },
                },
                required: ['level', 'allocatedMarks', 'percentage'],
              },
            },
            slots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  slotId: { type: Type.STRING },
                  questionNumber: { type: Type.STRING },
                  sectionId: { type: Type.STRING },
                  sectionName: { type: Type.STRING },
                  questionType: { type: Type.STRING },
                  marks: { type: Type.NUMBER },
                  isInternalChoice: { type: Type.BOOLEAN },
                  targetCO: { type: Type.STRING },
                  targetUnit: { type: Type.STRING },
                  targetBlooms: { type: Type.STRING },
                  assignedTopic: { type: Type.STRING },
                  sourceDocumentRef: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                },
                required: [
                  'slotId',
                  'questionNumber',
                  'sectionId',
                  'sectionName',
                  'questionType',
                  'marks',
                  'isInternalChoice',
                  'targetCO',
                  'targetUnit',
                  'targetBlooms',
                  'assignedTopic',
                  'sourceDocumentRef',
                  'rationale',
                ],
              },
            },
          },
          required: [
            'blueprintSummary',
            'totalAllocatedMarks',
            'totalQuestionsCount',
            'coDistribution',
            'bloomsDistribution',
            'slots',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Agent 2 (Blueprint) Error:', err);
    res.status(500).json({ error: err.message || 'Agent 2 failed to build assessment blueprint.' });
  }
});

// AGENT 3: Academic Question Paper & Stepwise Marking Scheme Generator
app.post('/api/agents/generate', async (req: Request, res: Response) => {
  try {
    const { documents, ingestionOutput, blueprintOutput, marksConfig } = req.body;
    const ai = getAiClient();
    const multimodalParts = await buildMultimodalParts(documents || []);

    const prompt = `You are Agent 3: University Examination Question Paper & Stepwise Marking Scheme Generator.
Generate a complete, rigorous, publication-ready university question paper following every single slot in Agent 2's Assessment Blueprint and grounded in the uploaded faculty documents.

Course: ${marksConfig.courseCode} — ${marksConfig.courseTitle}
Total Marks: ${marksConfig.maximumMarks} | Duration: ${marksConfig.durationMinutes} minutes

Knowledge Digest from Agent 1:
${JSON.stringify(ingestionOutput, null, 2)}

Assessment Blueprint Slots from Agent 2:
${JSON.stringify(blueprintOutput?.slots || [], null, 2)}

Requirements for each question:
1. Write a highly specific, mathematically/scientifically rigorous question stem appropriate for university examinations. Do NOT write vague or generic one-liners for 5-mark or 10-mark questions—include concrete parameters, equations, scenarios, or multi-part (a)/(b) sub-tasks in the stem.
2. If 'isInternalChoice' is true (or for long 10-mark questions), provide an equally rigorous 'alternativeQuestionStem' ("OR: ...").
3. Provide a comprehensive 'answerKey' with the complete solution / derivation.
4. Provide 'markingSchemeSteps' whose 'marksAwarded' sum up to the question's 'marks'.
5. Use one of these exact strings for 'bloomsLevel': 'L1: Remember', 'L2: Understand', 'L3: Apply', 'L4: Analyze', 'L5: Evaluate', 'L6: Create'.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [...multimodalParts, { text: prompt }],
      },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  questionNumber: { type: Type.STRING },
                  sectionId: { type: Type.STRING },
                  sectionName: { type: Type.STRING },
                  questionType: { type: Type.STRING },
                  stem: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  alternativeQuestionStem: { type: Type.STRING },
                  marks: { type: Type.NUMBER },
                  coCode: { type: Type.STRING },
                  syllabusUnit: { type: Type.STRING },
                  bloomsLevel: { type: Type.STRING },
                  sourceDocumentName: { type: Type.STRING },
                  sourceLocation: { type: Type.STRING },
                  expectedTimeMinutes: { type: Type.INTEGER },
                  answerKey: { type: Type.STRING },
                  markingSchemeSteps: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        stepDescription: { type: Type.STRING },
                        marksAwarded: { type: Type.NUMBER },
                      },
                      required: ['stepDescription', 'marksAwarded'],
                    },
                  },
                },
                required: [
                  'id',
                  'questionNumber',
                  'sectionId',
                  'sectionName',
                  'questionType',
                  'stem',
                  'marks',
                  'coCode',
                  'syllabusUnit',
                  'bloomsLevel',
                  'sourceDocumentName',
                  'sourceLocation',
                  'expectedTimeMinutes',
                  'answerKey',
                  'markingSchemeSteps',
                ],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{"questions":[]}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Agent 3 (Generate) Error:', err);
    res.status(500).json({ error: err.message || 'Agent 3 failed to generate question paper.' });
  }
});

// AGENT 4: Syllabus & Learning Objectives Validator / Auditor Agent
app.post('/api/agents/validate', async (req: Request, res: Response) => {
  try {
    const { questions, syllabusUnits, courseOutcomes, marksConfig } = req.body;
    const ai = getAiClient();

    const prompt = `You are Agent 4: Curriculum, Syllabus & Learning Objectives Validator Agent.
Perform an independent, critical academic audit of every generated question in the Question Paper against the official Syllabus Units, Course Learning Objectives (COs), Bloom's Taxonomy targets, and Marks Distribution rules.

Generated Questions to Audit:
${JSON.stringify(questions, null, 2)}

Official Syllabus Units:
${JSON.stringify(syllabusUnits, null, 2)}

Official Course Learning Objectives (COs):
${JSON.stringify(courseOutcomes, null, 2)}

Target Total Marks: ${marksConfig.maximumMarks}

Audit Criteria for Each Question:
1. 'syllabusFidelityPass': Is the topic strictly inside the provided Syllabus Units?
2. 'coAlignmentPass': Does the question genuinely test the assigned Course Outcome (CO)?
3. 'bloomsCalibrationPass': Does the cognitive depth of the question stem match the claimed Bloom's Taxonomy level and marks weight?
4. 'marksProportionalityPass': Do the marking scheme steps sum properly and match the complexity of the marks allocated?
5. Set 'status' to 'VERIFIED' if all 4 checks pass, 'NEEDS_REVISION' if cognitive depth or CO alignment needs refinement, or 'OUT_OF_SYLLABUS' if it drifts outside the syllabus.
6. Provide specific 'auditorFindings' and, if not VERIFIED, a concrete 'remediationSuggestion'.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallAuditStatus: { type: Type.STRING },
            overallAlignmentScore: { type: Type.NUMBER },
            syllabusCoveragePercentage: { type: Type.NUMBER },
            exactMarksSumVerified: { type: Type.BOOLEAN },
            computedTotalMarks: { type: Type.NUMBER },
            targetTotalMarks: { type: Type.NUMBER },
            verifiedCount: { type: Type.INTEGER },
            needsRevisionCount: { type: Type.INTEGER },
            outOfSyllabusCount: { type: Type.INTEGER },
            executiveAuditSummary: { type: Type.STRING },
            coAttainmentAudit: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  coCode: { type: Type.STRING },
                  targetWeightPercent: { type: Type.NUMBER },
                  actualWeightPercent: { type: Type.NUMBER },
                  status: { type: Type.STRING },
                },
                required: ['coCode', 'targetWeightPercent', 'actualWeightPercent', 'status'],
              },
            },
            questionAudits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionId: { type: Type.STRING },
                  questionNumber: { type: Type.STRING },
                  status: { type: Type.STRING },
                  alignmentScore: { type: Type.NUMBER },
                  syllabusFidelityPass: { type: Type.BOOLEAN },
                  coAlignmentPass: { type: Type.BOOLEAN },
                  bloomsCalibrationPass: { type: Type.BOOLEAN },
                  marksProportionalityPass: { type: Type.BOOLEAN },
                  verifiedBloomsLevel: { type: Type.STRING },
                  matchedSyllabusTopic: { type: Type.STRING },
                  matchedLearningObjectiveQuote: { type: Type.STRING },
                  auditorFindings: { type: Type.STRING },
                  remediationSuggestion: { type: Type.STRING },
                },
                required: [
                  'questionId',
                  'questionNumber',
                  'status',
                  'alignmentScore',
                  'syllabusFidelityPass',
                  'coAlignmentPass',
                  'bloomsCalibrationPass',
                  'marksProportionalityPass',
                  'verifiedBloomsLevel',
                  'matchedSyllabusTopic',
                  'matchedLearningObjectiveQuote',
                  'auditorFindings',
                ],
              },
            },
          },
          required: [
            'overallAuditStatus',
            'overallAlignmentScore',
            'syllabusCoveragePercentage',
            'exactMarksSumVerified',
            'computedTotalMarks',
            'targetTotalMarks',
            'verifiedCount',
            'needsRevisionCount',
            'outOfSyllabusCount',
            'executiveAuditSummary',
            'coAttainmentAudit',
            'questionAudits',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Agent 4 (Validate) Error:', err);
    res.status(500).json({ error: err.message || 'Agent 4 failed to validate question paper.' });
  }
});

// TARGETED REMEDIATION LOOP (Agent 3 + Agent 4 on a single question)
app.post('/api/agents/remediate-question', async (req: Request, res: Response) => {
  try {
    const { question, customInstruction, syllabusUnits, courseOutcomes, ingestionOutput } = req.body;
    const ai = getAiClient();

    const prompt = `You are the combined Question Remediation & Curriculum Validator Sub-Agent.
Rewrite and upgrade the following examination question so that it resolves all Auditor Findings and strictly satisfies its assigned Syllabus Unit, Course Outcome (${question.coCode}), Bloom's Taxonomy Level (${question.bloomsLevel}), and Marks Weight (${question.marks} marks).

Current Question:
${JSON.stringify(question, null, 2)}

Faculty / Validator Remediation Directive:
${customInstruction || question.validation?.remediationSuggestion || question.validation?.auditorFindings || 'Increase technical rigor, align strictly with the Course Outcome and target Bloom level, and provide a detailed stepwise marking scheme.'}

Syllabus Units:
${JSON.stringify(syllabusUnits, null, 2)}

Course Outcomes:
${JSON.stringify(courseOutcomes, null, 2)}

Extracted Document Knowledge:
${JSON.stringify(ingestionOutput?.extractedConcepts || [], null, 2)}

Return the upgraded question along with its freshly verified 'validation' audit object (with status 'VERIFIED' and alignmentScore >= 95).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.25,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            questionNumber: { type: Type.STRING },
            sectionId: { type: Type.STRING },
            sectionName: { type: Type.STRING },
            questionType: { type: Type.STRING },
            stem: { type: Type.STRING },
            alternativeQuestionStem: { type: Type.STRING },
            marks: { type: Type.NUMBER },
            coCode: { type: Type.STRING },
            syllabusUnit: { type: Type.STRING },
            bloomsLevel: { type: Type.STRING },
            sourceDocumentName: { type: Type.STRING },
            sourceLocation: { type: Type.STRING },
            expectedTimeMinutes: { type: Type.INTEGER },
            answerKey: { type: Type.STRING },
            markingSchemeSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepDescription: { type: Type.STRING },
                  marksAwarded: { type: Type.NUMBER },
                },
                required: ['stepDescription', 'marksAwarded'],
              },
            },
            validation: {
              type: Type.OBJECT,
              properties: {
                questionId: { type: Type.STRING },
                questionNumber: { type: Type.STRING },
                status: { type: Type.STRING },
                alignmentScore: { type: Type.NUMBER },
                syllabusFidelityPass: { type: Type.BOOLEAN },
                coAlignmentPass: { type: Type.BOOLEAN },
                bloomsCalibrationPass: { type: Type.BOOLEAN },
                marksProportionalityPass: { type: Type.BOOLEAN },
                verifiedBloomsLevel: { type: Type.STRING },
                matchedSyllabusTopic: { type: Type.STRING },
                matchedLearningObjectiveQuote: { type: Type.STRING },
                auditorFindings: { type: Type.STRING },
              },
              required: [
                'questionId',
                'questionNumber',
                'status',
                'alignmentScore',
                'syllabusFidelityPass',
                'coAlignmentPass',
                'bloomsCalibrationPass',
                'marksProportionalityPass',
                'verifiedBloomsLevel',
                'matchedSyllabusTopic',
                'matchedLearningObjectiveQuote',
                'auditorFindings',
              ],
            },
          },
          required: [
            'id',
            'questionNumber',
            'sectionId',
            'sectionName',
            'questionType',
            'stem',
            'marks',
            'coCode',
            'syllabusUnit',
            'bloomsLevel',
            'sourceDocumentName',
            'sourceLocation',
            'expectedTimeMinutes',
            'answerKey',
            'markingSchemeSteps',
            'validation',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Remediation Error:', err);
    res.status(500).json({ error: err.message || 'Failed to remediate question.' });
  }
});

// Verify external Google Colab FastAPI Tunnel URL connectivity
app.post('/api/colab/verify-tunnel', async (req: Request, res: Response) => {
  try {
    const { tunnelUrl } = req.body;
    if (!tunnelUrl || typeof tunnelUrl !== 'string') {
      res.status(400).json({ error: 'Please provide a valid FastAPI / Google Colab tunnel URL.' });
      return;
    }
    const cleanUrl = tunnelUrl.replace(/\/+$/, '');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${cleanUrl}/api/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(502).json({
        connected: false,
        error: `Remote FastAPI endpoint responded with HTTP ${response.status}. Ensure Step 5 in your Google Colab notebook is running.`,
      });
      return;
    }
    const data = await response.json();
    res.json({
      connected: true,
      remoteInfo: data,
    });
  } catch (err: any) {
    res.status(502).json({
      connected: false,
      error: `Could not reach Colab tunnel (${err.message || 'timeout'}). You can continue using the Built-in Cloud Multi-Agent Engine with zero setup.`,
    });
  }
});

// Publish repository to user's GitHub & configure standard GitHub Pages
app.post('/api/github/publish', async (req: Request, res: Response) => {
  try {
    const {
      githubToken,
      repoName = 'syllabiq',
      isPrivate = false,
    } = req.body;

    if (!githubToken || typeof githubToken !== 'string') {
      res.status(400).json({
        error: 'A GitHub Personal Access Token (with repo & workflow permissions) is required to push directly to your GitHub account.',
      });
      return;
    }

    const cleanToken = githubToken.trim();
    const ghHeaders = {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'SyllabiQ-Deployer',
    };

    // 1. Authenticate GitHub User
    const userRes = await fetch('https://api.github.com/user', { headers: ghHeaders });
    if (!userRes.ok) {
      const errBody = await userRes.json().catch(() => ({}));
      res.status(401).json({
        error: `GitHub authentication failed (${errBody.message || userRes.statusText}). Please check your Personal Access Token.`,
      });
      return;
    }
    const ghUser = await userRes.json();
    const owner = ghUser.login;

    // 2. Create or verify repository
    let repoCreated = false;
    const createRepoRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: ghHeaders,
      body: JSON.stringify({
        name: repoName.trim(),
        description:
          'SyllabiQ — Multimodal Multi-Agent Question-Paper Generator & Curriculum Validator (React + FastAPI + Google Colab)',
        homepage: `https://${owner}.github.io/${repoName.trim()}/`,
        private: Boolean(isPrivate),
        auto_init: true,
      }),
    });

    if (createRepoRes.ok) {
      repoCreated = true;
    } else if (createRepoRes.status !== 422) {
      const errBody = await createRepoRes.json().catch(() => ({}));
      res.status(400).json({
        error: `Could not create repository '${repoName}': ${errBody.message || createRepoRes.statusText}`,
      });
      return;
    }

    // Wait briefly if repository was just initialized with auto_init
    if (repoCreated) {
      await new Promise((r) => setTimeout(r, 1500));
    }

    // 3. Collect project files to push
    const filesToSync = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'index.html',
      'metadata.json',
      '.gitignore',
      '.env.example',
      'README.md',
      'server.ts',
      'backend/fastapi_main.py',
      'public/.nojekyll',
      'public/404.html',
      '.github/workflows/deploy.yml',
      'src/main.tsx',
      'src/index.css',
      'src/App.tsx',
      'src/types/assessment.ts',
      'src/data/sampleCourses.ts',
      'src/utils/colabGenerator.ts',
      'src/utils/agentClient.ts',
      'src/components/MultiAgentPipelineBar.tsx',
      'src/components/DocumentSyllabusStudio.tsx',
      'src/components/MarksBlueprintView.tsx',
      'src/components/QuestionPaperView.tsx',
      'src/components/SyllabusAuditView.tsx',
      'src/components/ColabFastApiBridgeView.tsx',
      'src/components/CreateSubjectModal.tsx',
    ];

    const treeItems: {
      path: string;
      mode: '100644';
      type: 'blob';
      content: string;
    }[] = [];

    for (const relPath of filesToSync) {
      try {
        const absPath = path.resolve(__dirname, relPath);
        const content = await fs.readFile(absPath, 'utf8');
        treeItems.push({
          path: relPath,
          mode: '100644',
          type: 'blob',
          content,
        });
      } catch {
        // Skip if optional file missing
      }
    }

    // 4. Get latest commit SHA on default branch (main or master)
    let branchName = 'main';
    let refRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/main`,
      { headers: ghHeaders }
    );
    if (!refRes.ok) {
      branchName = 'master';
      refRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/master`,
        { headers: ghHeaders }
      );
    }

    if (!refRes.ok) {
      res.status(500).json({
        error: 'Repository exists but has no initialized default branch. Ensure auto_init is enabled.',
      });
      return;
    }
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    // 5. Create Git Tree with all project files
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/trees`,
      {
        method: 'POST',
        headers: ghHeaders,
        body: JSON.stringify({
          base_tree: latestCommitSha,
          tree: treeItems,
        }),
      }
    );

    if (!treeRes.ok) {
      const errBody = await treeRes.json().catch(() => ({}));
      res.status(400).json({
        error: `Failed to create Git tree (${errBody.message || treeRes.statusText}). Ensure your token has 'workflow' scope to push .github/workflows/deploy.yml.`,
      });
      return;
    }
    const treeData = await treeRes.json();

    // 6. Create Commit
    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/commits`,
      {
        method: 'POST',
        headers: ghHeaders,
        body: JSON.stringify({
          message: 'Deploy SyllabiQ Multi-Agent Web App to GitHub Pages',
          tree: treeData.sha,
          parents: [latestCommitSha],
        }),
      }
    );
    const commitData = await commitRes.json();

    // 7. Update Branch Reference
    await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branchName}`,
      {
        method: 'PATCH',
        headers: ghHeaders,
        body: JSON.stringify({
          sha: commitData.sha,
          force: true,
        }),
      }
    );

    // 8. Enable GitHub Pages (GitHub Actions workflow mode)
    await fetch(`https://api.github.com/repos/${owner}/${repoName}/pages`, {
      method: 'POST',
      headers: ghHeaders,
      body: JSON.stringify({
        build_type: 'workflow',
        source: {
          branch: branchName,
          path: '/',
        },
      }),
    }).catch(() => {});

    res.json({
      success: true,
      owner,
      repoName,
      repoUrl: `https://github.com/${owner}/${repoName}`,
      actionsUrl: `https://github.com/${owner}/${repoName}/actions`,
      ghPagesDefaultUrl: `https://${owner}.github.io/${repoName}/`,
      filesPushed: treeItems.length,
    });
  } catch (err: any) {
    console.error('GitHub Publish Error:', err);
    res.status(500).json({ error: err.message || 'Failed to publish to GitHub.' });
  }
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SyllabiQ Multi-Agent Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
