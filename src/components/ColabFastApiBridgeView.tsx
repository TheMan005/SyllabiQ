import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Terminal,
  Server,
  FileCode,
  Globe,
  ExternalLink,
  Rocket,
  ShieldCheck,
  ArrowLeft,
  Code,
} from 'lucide-react';
import {
  MarksDistributionConfig,
  CourseOutcome,
  SyllabusUnit,
} from '../types/assessment';
import {
  generateFastAPIPythonCode,
  generateColabNotebookJson,
} from '../utils/colabGenerator';

interface ColabFastApiBridgeViewProps {
  marksConfig: MarksDistributionConfig;
  courseOutcomes: CourseOutcome[];
  syllabusUnits: SyllabusUnit[];
  colabTunnelUrl: string;
  onUpdateColabTunnelUrl: (url: string) => void;
  onBackToFaculty?: () => void;
}

interface PublishSuccessResult {
  owner: string;
  repoName: string;
  repoUrl: string;
  actionsUrl: string;
  ghPagesDefaultUrl: string;
  customDomainUrl: string | null;
  filesPushed: number;
}

export const ColabFastApiBridgeView: React.FC<ColabFastApiBridgeViewProps> = ({
  marksConfig,
  courseOutcomes,
  syllabusUnits,
  colabTunnelUrl,
  onUpdateColabTunnelUrl,
  onBackToFaculty,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedDns, setCopiedDns] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  // GitHub Repository & GitHub Pages Publisher State
  const [githubToken, setGithubToken] = useState('');
  const [repoName, setRepoName] = useState('syllabiq');
  const [customDomain, setCustomDomain] = useState('syllabiq.com');
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);
  const [isPublishingGh, setIsPublishingGh] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishSuccessResult | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const fastApiCode = generateFastAPIPythonCode(
    marksConfig,
    courseOutcomes,
    syllabusUnits
  );

  const handleDownloadColabNotebook = () => {
    const ipynbJson = generateColabNotebookJson(
      marksConfig,
      courseOutcomes,
      syllabusUnits
    );
    const blob = new Blob([ipynbJson], { type: 'application/x-ipynb+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SyllabiQ_MultiAgent_${marksConfig.courseCode}_Colab.ipynb`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFastApiPy = () => {
    const blob = new Blob([fastApiCode], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fastapi_main.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(fastApiCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyDnsRecords = async () => {
    const dnsText = `A     @    185.199.108.153
A     @    185.199.109.153
A     @    185.199.110.153
A     @    185.199.111.153
CNAME www  ${ publishResult?.owner || '<your-github-username>' }.github.io`;
    try {
      await navigator.clipboard.writeText(dnsText);
      setCopiedDns(true);
      setTimeout(() => setCopiedDns(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handlePublishToGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishingGh(true);
    setPublishError(null);
    setPublishResult(null);

    try {
      const res = await fetch('/api/github/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken,
          repoName: repoName.trim() || 'syllabiq',
          customDomain: customDomain.trim() || 'syllabiq.com',
          isPrivate: isPrivateRepo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to push repository to GitHub.');
      }
      setPublishResult(data);
    } catch (err: any) {
      setPublishError(
        err.message || 'Could not publish to GitHub. Verify your token permissions.'
      );
    } finally {
      setIsPublishingGh(false);
    }
  };

  const handleVerifyTunnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colabTunnelUrl.trim()) {
      setVerifyMessage({
        ok: true,
        text: 'Using Built-in Cloud Multi-Agent Engine (Zero-Config Mode Active).',
      });
      return;
    }

    setVerifying(true);
    setVerifyMessage(null);
    try {
      const res = await fetch('/api/colab/verify-tunnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tunnelUrl: colabTunnelUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.connected) {
        setVerifyMessage({
          ok: true,
          text: `Connected to Google Colab FastAPI Engine (${data.remoteInfo?.service || 'FastAPI v2.4'}).`,
        });
      } else {
        setVerifyMessage({
          ok: false,
          text:
            data.error ||
            'Could not reach remote Colab tunnel. Falling back to Built-in Cloud Engine.',
        });
      }
    } catch (err: any) {
      setVerifyMessage({
        ok: false,
        text: err.message || 'Network error while verifying tunnel.',
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Back to Faculty Workflow Breadcrumb */}
      {onBackToFaculty && (
        <div className="flex items-center justify-between pb-2">
          <button
            type="button"
            onClick={onBackToFaculty}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>← Return to Faculty Question-Paper Dashboard</span>
          </button>
          <span className="text-[11px] font-mono text-slate-400">
            Developer Mode Active
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider bg-slate-900 text-slate-100 px-2 py-0.5 rounded font-semibold">
              Developer Console
            </span>
            <p className="text-xs font-semibold text-blue-900 tracking-tight">
              FastAPI Orchestrator, GitHub Pages & Colab Runtime
            </p>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Developer Console & Deployment Hub
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Configure backend FastAPI endpoints, deploy the repository to GitHub Pages with custom domain routing for <strong>syllabiq.com</strong>, or export the Google Colab <code className="font-mono-tabular">.ipynb</code> notebook.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadFastApiPy}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-700" />
            <span>Download FastAPI (fastapi_main.py)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadColabNotebook}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Colab Notebook (.ipynb)</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: GITHUB REPOSITORY & GITHUB PAGES (SYLLABIQ.COM) DEPLOYMENT CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: 1-Click GitHub API Publisher (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-blue-900" />
                <span>Push New Repository to GitHub & Activate GitHub Pages</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Pre-configured with <code className="font-mono-tabular">.github/workflows/deploy.yml</code> and <code className="font-mono-tabular">public/CNAME</code> (<code className="font-mono-tabular">syllabiq.com</code>).
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CI/CD Workflow Ready</span>
            </span>
          </div>

          {/* Two Options Explanation */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 space-y-1.5">
            <p className="font-semibold text-slate-900">
              Two Ways to Push to Your GitHub Account:
            </p>
            <p>
              <strong>Option A (AI Studio Toolbar):</strong> Click the <strong>GitHub icon</strong> in the top-right bar of Google AI Studio to export directly to a new repository. Because <code className="font-mono-tabular">.github/workflows/deploy.yml</code> and <code className="font-mono-tabular">public/CNAME</code> are already in this workspace, GitHub Actions will build and deploy your web app automatically.
            </p>
            <p>
              <strong>Option B (Direct 1-Click API Push Below):</strong> Enter a GitHub Personal Access Token (with <code className="font-mono-tabular">repo</code> and <code className="font-mono-tabular">workflow</code> scopes) below to create the repository, commit all 27 files, and enable GitHub Pages + <code className="font-mono-tabular">syllabiq.com</code> automatically.
            </p>
          </div>

          <form onSubmit={handlePublishToGitHub} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New GitHub Repository Name
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="syllabiq"
                  className="w-full text-xs font-mono-tabular px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Domain (CNAME)
                </label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="syllabiq.com"
                  className="w-full text-xs font-mono-tabular px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  GitHub Personal Access Token (Classic <code className="font-mono-tabular">ghp_...</code> with <code className="font-mono-tabular">repo</code> & <code className="font-mono-tabular">workflow</code> scopes)
                </label>
              </div>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full text-xs font-mono-tabular px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivateRepo}
                  onChange={(e) => setIsPrivateRepo(e.target.checked)}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-700"
                />
                <span>Create as Private Repository (Note: GitHub Pages on free accounts requires Public)</span>
              </label>

              <button
                type="submit"
                disabled={isPublishingGh || !githubToken.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isPublishingGh ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Pushing to GitHub & Enabling Pages...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Create Repo & Deploy to GitHub Pages</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {publishError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <span>{publishError}</span>
            </div>
          )}

          {publishResult && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-semibold text-emerald-900">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>
                    Successfully Pushed {publishResult.filesPushed} Files & Activated GitHub Pages!
                  </span>
                </span>
              </div>

              <div className="space-y-1 font-mono-tabular text-slate-700">
                <div>
                  Repository:{' '}
                  <a
                    href={publishResult.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-800 underline inline-flex items-center gap-1"
                  >
                    {publishResult.repoUrl}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  GitHub Actions Build:{' '}
                  <a
                    href={publishResult.actionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-800 underline inline-flex items-center gap-1"
                  >
                    {publishResult.actionsUrl}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  GitHub Pages URL:{' '}
                  <a
                    href={publishResult.ghPagesDefaultUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-800 underline inline-flex items-center gap-1"
                  >
                    {publishResult.ghPagesDefaultUrl}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {publishResult.customDomainUrl && (
                  <div>
                    Custom Domain Configured:{' '}
                    <span className="font-semibold text-slate-900">
                      {publishResult.customDomainUrl}
                    </span>{' '}
                    (Point your DNS records on the right to complete activation)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Custom Domain DNS Setup for syllabiq.com (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-900" />
                <span>Custom Domain Setup (<code className="font-mono-tabular">syllabiq.com</code>)</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Required DNS records at your domain registrar to point <code className="font-mono-tabular">syllabiq.com</code> to GitHub Pages.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyDnsRecords}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedDns ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Copied DNS</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Records</span>
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono-tabular">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-sans font-semibold">
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 px-2">Host</th>
                  <th className="py-2 pl-2">Value / Points To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                <tr>
                  <td className="py-2 pr-2 font-bold text-blue-900">A</td>
                  <td className="py-2 px-2">@</td>
                  <td className="py-2 pl-2">185.199.108.153</td>
                </tr>
                <tr>
                  <td className="py-2 pr-2 font-bold text-blue-900">A</td>
                  <td className="py-2 px-2">@</td>
                  <td className="py-2 pl-2">185.199.109.153</td>
                </tr>
                <tr>
                  <td className="py-2 pr-2 font-bold text-blue-900">A</td>
                  <td className="py-2 px-2">@</td>
                  <td className="py-2 pl-2">185.199.110.153</td>
                </tr>
                <tr>
                  <td className="py-2 pr-2 font-bold text-blue-900">A</td>
                  <td className="py-2 px-2">@</td>
                  <td className="py-2 pl-2">185.199.111.153</td>
                </tr>
                <tr>
                  <td className="py-2 pr-2 font-bold text-blue-900">CNAME</td>
                  <td className="py-2 px-2">www</td>
                  <td className="py-2 pl-2">
                    {publishResult?.owner || '<your-github-username>'}.github.io
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Included Static Web App Enhancements for GitHub Pages</span>
            </div>
            <p className="leading-relaxed">
              • <code className="font-mono-tabular">public/CNAME</code> is pre-populated with <code className="font-mono-tabular">syllabiq.com</code>.
            </p>
            <p className="leading-relaxed">
              • <code className="font-mono-tabular">.github/workflows/deploy.yml</code> runs <code className="font-mono-tabular">vite build</code> and deploys to GitHub Pages automatically.
            </p>
            <p className="leading-relaxed">
              • Client-side PPTX/PDF parser & multi-agent fallback ensures the web app runs smoothly on static GitHub Pages even when no external backend server is active.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: GOOGLE COLAB & FASTAPI MULTI-AGENT ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-900" />
              <span>Multi-Agent Execution Engine Selector</span>
            </h2>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Hybrid Cloud + Static Ready</span>
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
              <span>Mode 1: Integrated Multi-Agent Engine (Default)</span>
              <span className="font-mono-tabular text-emerald-700">ACTIVE</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatically uses the full-stack Gemini 3.8 Flash server when available, and seamlessly switches to the browser-native multi-agent engine when hosted as a static site on GitHub Pages (<code className="font-mono-tabular">syllabiq.com</code>).
            </p>
          </div>

          <form onSubmit={handleVerifyTunnel} className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-800">
              Mode 2: Connect External Google Colab FastAPI Tunnel URL (Optional for GitHub Pages)
            </label>
            <p className="text-xs text-slate-500">
              When running on <code className="font-mono-tabular">syllabiq.com</code> (GitHub Pages), you can also connect your live Google Colab FastAPI <code className="font-mono-tabular">ngrok</code> or <code className="font-mono-tabular">cloudflared</code> URL below:
            </p>
            <div className="flex items-center gap-2.5">
              <input
                type="url"
                placeholder="https://xxxx-xx-xxx-xxx.ngrok-free.app"
                value={colabTunnelUrl}
                onChange={(e) => onUpdateColabTunnelUrl(e.target.value)}
                className="flex-1 text-xs font-mono-tabular px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
              <button
                type="submit"
                disabled={verifying}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <span>Verify Tunnel</span>
                )}
              </button>
            </div>

            {verifyMessage && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  verifyMessage.ok
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50/60 border-amber-200 text-amber-800'
                }`}
              >
                {verifyMessage.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{verifyMessage.text}</span>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Google Colab Quickstart Steps */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-900" />
              <span>Google Colab Notebook Architecture ({marksConfig.courseCode})</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              What is included inside your generated <code className="font-mono-tabular">.ipynb</code> notebook:
            </p>
          </div>

          <div className="divide-y divide-slate-200 text-xs">
            <div className="py-3 first:pt-0">
              <p className="font-semibold text-slate-900">
                Cell 01 · Multimodal Document Dependencies
              </p>
              <p className="text-slate-600 mt-0.5 font-mono-tabular">
                !pip install fastapi uvicorn pyngrok python-multipart google-genai pymupdf python-pptx pillow
              </p>
            </div>
            <div className="py-3">
              <p className="font-semibold text-slate-900">
                Cell 02 · Agent 01 & Agent 02 (Ingestion + Blueprint Matrix)
              </p>
              <p className="text-slate-600 mt-0.5">
                Extracts text, formulas, and embedded images from PDF, PPTX, JPEG, and PNG files and builds the {marksConfig.maximumMarks}-mark specification matrix.
              </p>
            </div>
            <div className="py-3">
              <p className="font-semibold text-slate-900">
                Cell 03 · Agent 03 & Agent 04 (Question Paper + Syllabus Validator)
              </p>
              <p className="text-slate-600 mt-0.5">
                Generates the examination questions, stepwise marking rubrics, and audits every item against {courseOutcomes.length} Course Outcomes and {syllabusUnits.length} Syllabus Units.
              </p>
            </div>
            <div className="py-3 last:pb-0">
              <p className="font-semibold text-slate-900">
                Cell 04 · Interactive Colab Uploader & FastAPI Uvicorn Server
              </p>
              <p className="text-slate-600 mt-0.5">
                Lets faculty upload files directly via <code className="font-mono-tabular">google.colab.files.upload()</code> or expose REST endpoints on port 8000.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full FastAPI Python Multi-Agent Code Viewer */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              FastAPI Multi-Agent Orchestrator Source Code (<code className="font-mono-tabular">fastapi_main.py</code>)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pre-configured for {marksConfig.courseCode}: {marksConfig.courseTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Python Code</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-6 bg-slate-950 text-slate-100 text-xs font-mono-tabular overflow-x-auto max-h-[480px] leading-relaxed">
          {fastApiCode}
        </pre>
      </div>
    </div>
  );
};
