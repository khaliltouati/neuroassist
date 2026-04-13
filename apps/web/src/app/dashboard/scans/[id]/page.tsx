"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, type MRIScan } from "@/services/api";
import {
  ArrowLeft,
  Brain,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const predictionBadge: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  glioma: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", glow: "shadow-red-100" },
  meningioma: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", glow: "shadow-orange-100" },
  pituitary: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", glow: "shadow-yellow-100" },
  no_tumor: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", glow: "shadow-emerald-100" },
};

const EXPLANATIONS: Record<string, string> = {
  glioma:
    "The AI model detected patterns consistent with a glioma. Areas highlighted in the heatmap indicate regions that most influenced this prediction. Please correlate with clinical findings.",
  meningioma:
    "The AI model detected patterns consistent with a meningioma. The heatmap highlights the regions contributing most to this classification. Clinical correlation is recommended.",
  pituitary:
    "The AI model detected patterns consistent with a pituitary tumor. The highlighted regions in the heatmap show key areas influencing the prediction. Further clinical evaluation is advised.",
  no_tumor:
    "The AI model did not detect patterns consistent with a brain tumor. The heatmap shows the regions analyzed. This is a decision-support result and does not replace clinical judgment.",
};

export default function ScanResultPage() {
  const { id: scanId } = useParams<{ id: string }>();

  const [scan, setScan] = useState<MRIScan | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  // Heatmap overlay toggle
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Feedback
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState<boolean | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const loadScan = useCallback(async () => {
    try {
      const data = await api.getScan(scanId);
      setScan(data);
    } catch {
      setError("Failed to load scan data");
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  useEffect(() => {
    loadScan();
  }, [loadScan]);

  async function handleAnalyze() {
    if (!scan) return;
    setAnalyzing(true);
    setError("");
    try {
      const result = await api.analyzeScan(scan.id);
      setScan({
        ...scan,
        prediction: result.prediction,
        confidence: result.confidence,
        heatmap_path: result.heatmap_url,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleFeedback(isCorrect: boolean) {
    if (!scan) return;
    setFeedbackCorrect(isCorrect);
  }

  async function submitFeedback() {
    if (!scan || feedbackCorrect === null) return;
    setSubmittingFeedback(true);
    try {
      await api.submitFeedback(scan.id, feedbackCorrect, feedbackComment);
      setFeedbackSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Feedback submission failed");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!scan) {
    return <p className="text-slate-500">{error || "Scan not found"}</p>;
  }

  const badge = scan.prediction
    ? predictionBadge[scan.prediction] || {
        bg: "bg-slate-50",
        border: "border-slate-200",
        text: "text-slate-700",
        glow: "",
      }
    : null;

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href={`/dashboard/patients/${scan.patient_id}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/60 bg-white text-slate-400 shadow-card transition hover:text-slate-600"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Scan Results</h1>
          <p className="text-sm text-slate-400">
            Scan {scanId.slice(0, 8)}… &middot;{" "}
            {new Date(scan.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Not analyzed yet */}
      {!scan.prediction && (
        <div className="mb-8 rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <Brain className="text-slate-300" size={32} />
          </div>
          <p className="mb-1 font-medium text-slate-500">
            This scan has not been analyzed yet.
          </p>
          <p className="mb-6 text-sm text-slate-400">Run the AI model to get a prediction.</p>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-500 active:scale-[0.98] disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Running AI Analysis…
              </>
            ) : (
              <>
                <Brain size={18} />
                Run AI Analysis
              </>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {scan.prediction && (
        <>
          {/* Image viewer */}
          <div className="mb-6 grid gap-5 lg:grid-cols-2">
            {/* Original MRI */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-card">
              <div className="border-b border-slate-100 px-5 py-3">
                <h3 className="text-[13px] font-semibold text-slate-900">
                  Original MRI
                </h3>
              </div>
              <div className="flex items-center justify-center bg-slate-950 p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${API_URL}${scan.image_path}`}
                  alt="Original MRI"
                  className="h-64 w-64 rounded-xl object-contain"
                />
              </div>
            </div>

            {/* Heatmap overlay */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <h3 className="text-[13px] font-semibold text-slate-900">
                  Grad-CAM Heatmap
                </h3>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100"
                >
                  {showHeatmap ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showHeatmap ? "Hide" : "Show"}
                </button>
              </div>
              <div className="flex items-center justify-center bg-slate-950 p-6">
                {scan.heatmap_path && showHeatmap ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_URL}${scan.heatmap_path}`}
                    alt="Grad-CAM Heatmap"
                    className="h-64 w-64 rounded-xl object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_URL}${scan.image_path}`}
                    alt="Original MRI (no overlay)"
                    className="h-64 w-64 rounded-xl object-contain"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Prediction card */}
          <div
            className={`mb-6 rounded-2xl border ${badge?.border || "border-slate-200"} ${badge?.bg || "bg-white"} p-6 shadow-card ${badge?.glow || ""}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  AI Prediction
                </p>
                <p
                  className={`mt-1 text-3xl font-bold capitalize tracking-tight ${badge?.text || "text-slate-900"}`}
                >
                  {scan.prediction.replace("_", " ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Confidence</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  {((scan.confidence ?? 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="mt-5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/60">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    (scan.confidence ?? 0) >= 0.8
                      ? "bg-emerald-500"
                      : (scan.confidence ?? 0) >= 0.5
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${(scan.confidence ?? 0) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="mb-6 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-card">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <AlertTriangle className="text-amber-500" size={16} />
              </div>
              <div>
                <h3 className="mb-1 text-[13px] font-semibold text-slate-900">
                  AI Explanation
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  {EXPLANATIONS[scan.prediction] ||
                    "AI analysis complete. Please correlate with clinical findings."}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-amber-50/60 px-4 py-3">
              <p className="text-[12px] leading-relaxed text-amber-600">
                <strong>Disclaimer:</strong> This is a decision-support tool and
                is not intended for medical diagnosis. Always correlate AI
                findings with clinical judgment and additional diagnostic tests.
              </p>
            </div>
          </div>

          {/* Feedback */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-card">
            <h3 className="text-[13px] font-semibold text-slate-900">
              Doctor Feedback
            </h3>
            <p className="mb-6 mt-1 text-[12px] text-slate-400">
              Was this AI prediction correct? Your feedback helps improve the
              model.
            </p>

            {feedbackSubmitted ? (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-5 py-4">
                <CheckCircle2 className="text-emerald-600" size={20} />
                <p className="text-sm font-semibold text-emerald-700">
                  Thank you! Your feedback has been recorded.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFeedback(true)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition-all ${
                      feedbackCorrect === true
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/50"
                    }`}
                  >
                    <ThumbsUp size={16} />
                    Correct
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition-all ${
                      feedbackCorrect === false
                        ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                        : "border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50/50"
                    }`}
                  >
                    <ThumbsDown size={16} />
                    Incorrect
                  </button>
                </div>

                {feedbackCorrect !== null && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-slate-600">
                        Comment (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Add any notes about the diagnosis…"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 shadow-card outline-none placeholder:text-slate-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      />
                    </div>
                    <button
                      onClick={submitFeedback}
                      disabled={submittingFeedback}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 active:scale-[0.98] disabled:opacity-50"
                    >
                      {submittingFeedback ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        "Submit Feedback"
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-[11px] text-slate-300">
            This tool is for decision-support only and is not intended for
            medical diagnosis.
          </p>
        </>
      )}
    </div>
  );
}
