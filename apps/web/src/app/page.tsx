"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 text-white">
      {/* Hero */}
      <div className="mx-auto max-w-3xl px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-brand-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Clinical Decision Support
        </div>

        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Neuro<span className="text-brand-400">Assist</span> AI
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-slate-300">
          Upload MRI scans, run AI-powered analysis, and get instant
          decision-support insights — all from a single dashboard designed for
          clinicians.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-brand-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-brand-500"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-white/20 bg-white/5 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Create Account
          </Link>
        </div>

        <p className="mt-16 text-xs text-slate-500">
          This tool is for educational and research purposes only and is not
          intended for medical diagnosis.
        </p>
      </div>
    </div>
  );
}
