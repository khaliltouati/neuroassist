"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, type Patient, type MRIScan } from "@/services/api";
import {
  ArrowLeft,
  Upload,
  Brain,
  User,
  Calendar,
  FileText,
  Loader2,
  Pencil,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const predictionColors: Record<string, string> = {
  glioma: "bg-red-100 text-red-700",
  meningioma: "bg-orange-100 text-orange-700",
  pituitary: "bg-yellow-100 text-yellow-700",
  no_tumor: "bg-emerald-100 text-emerald-700",
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [scans, setScans] = useState<MRIScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Upload
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", age: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([api.getPatient(id), api.getScans(id)]);
      setPatient(p);
      setScans(s);
      setEditForm({ name: p.name, age: String(p.age), notes: p.notes });
    } catch {
      setError("Failed to load patient data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const scan = await api.uploadScan(id, file);
      setScans((prev) => [scan, ...prev]);
      setFile(null);
      setPreview(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze(scanId: string) {
    setAnalyzing(scanId);
    try {
      const result = await api.analyzeScan(scanId);
      setScans((prev) =>
        prev.map((s) =>
          s.id === scanId
            ? {
                ...s,
                prediction: result.prediction,
                confidence: result.confidence,
                heatmap_path: result.heatmap_url,
              }
            : s
        )
      );
      router.push(`/dashboard/scans/${scanId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(null);
    }
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updatePatient(id, {
        name: editForm.name,
        age: parseInt(editForm.age),
        notes: editForm.notes,
      });
      setPatient(updated);
      setShowEdit(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!patient) {
    return <p className="text-slate-500">{error || "Patient not found"}</p>;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/dashboard/patients"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/60 bg-white text-slate-400 shadow-card transition hover:text-slate-600"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{patient.name}</h1>
          <p className="text-sm text-slate-400">Patient Profile</p>
        </div>
        <button
          onClick={() => setShowEdit(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-card transition hover:shadow-card-hover"
        >
          <Pencil size={14} />
          Edit
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Patient Info */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: User, label: "Name", value: patient.name },
          { icon: Calendar, label: "Age", value: `${patient.age} years` },
          { icon: FileText, label: "Notes", value: patient.notes || "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
              <Icon className="text-brand-500" size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Section */}
      <div className="mb-8 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-card">
        <h2 className="mb-5 text-base font-bold text-slate-900">Upload MRI Scan</h2>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-[13px] font-semibold text-slate-600">
              Select MRI image
            </label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.bmp,.tif,.tiff"
              onChange={handleFileChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-card file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 active:scale-[0.98] disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>

        {preview && (
          <div className="mt-5">
            <p className="mb-2 text-[13px] font-semibold text-slate-500">Preview</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="MRI Preview"
              className="h-48 w-48 rounded-2xl border border-slate-200/60 object-cover shadow-card"
            />
          </div>
        )}
      </div>

      {/* Scans List */}
      <div>
        <h2 className="mb-5 text-base font-bold text-slate-900">
          MRI Scans
          <span className="ml-2 rounded-lg bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-400">
            {scans.length}
          </span>
        </h2>

        {scans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
              <Brain className="text-slate-300" size={32} />
            </div>
            <p className="font-medium text-slate-500">No scans uploaded yet</p>
            <p className="mt-1 text-sm text-slate-400">Upload an MRI image above to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="group overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-card transition-all hover:shadow-card-hover"
              >
                {/* Thumbnail */}
                <div className="relative h-44 bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${API_URL}${scan.image_path}`}
                    alt="MRI Scan"
                    className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                  />
                  {scan.prediction && (
                    <span
                      className={`absolute right-3 top-3 rounded-lg px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
                        predictionColors[scan.prediction] ||
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {scan.prediction.replace("_", " ")}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="mb-0.5 text-sm font-semibold text-slate-900">
                    Scan {scan.id.slice(0, 8)}…
                  </p>
                  <p className="mb-4 text-[12px] text-slate-400">
                    {new Date(scan.created_at).toLocaleString()}
                  </p>

                  {scan.prediction ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-slate-500">
                        Confidence:{" "}
                        <span className="font-bold text-slate-700">
                          {((scan.confidence ?? 0) * 100).toFixed(1)}%
                        </span>
                      </span>
                      <Link
                        href={`/dashboard/scans/${scan.id}`}
                        className="text-[13px] font-semibold text-brand-600 transition hover:text-brand-500"
                      >
                        View Results →
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAnalyze(scan.id)}
                      disabled={analyzing === scan.id}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 active:scale-[0.98] disabled:opacity-50"
                    >
                      {analyzing === scan.id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Analyzing…
                        </>
                      ) : (
                        <>
                          <Brain size={14} />
                          Run AI Analysis
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Patient Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg animate-slide-up rounded-2xl bg-white p-7 shadow-xl">
            <h2 className="mb-6 text-xl font-bold tracking-tight text-slate-900">
              Edit Patient
            </h2>
            <form onSubmit={handleEdit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-card outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                  Age
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={199}
                  value={editForm.age}
                  onChange={(e) =>
                    setEditForm({ ...editForm, age: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-card outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-card outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
