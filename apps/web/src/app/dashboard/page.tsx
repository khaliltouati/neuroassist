"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import StatCard from "@/components/StatCard";
import RecentScans from "@/components/RecentScans";
import AccuracyChart from "@/components/AccuracyChart";
import { Users, Brain, Activity, Target } from "lucide-react";

interface DashboardData {
  total_patients: number;
  total_scans: number;
  ai_accuracy: number;
  recent_scans: Array<{
    id: string;
    patient_id: string;
    image_path: string;
    prediction: string | null;
    confidence: number | null;
    heatmap_path: string | null;
    created_at: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    api.getDashboard().then(setStats).finally(() => setLoading(false));

    const hour = new Date().getHours();
    if (hour >= 17) setGreeting("Good evening");
    else if (hour >= 12) setGreeting("Good afternoon");
  }, []);

  const userName = (() => {
    if (typeof window === "undefined") return "";
    try {
      const raw = localStorage.getItem("user");
      const u = raw ? JSON.parse(raw) : null;
      return u?.name?.split(" ")[0] || "Doctor";
    } catch {
      return "Doctor";
    }
  })();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!stats) return <p className="text-slate-500">Failed to load dashboard.</p>;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {greeting}, {userName}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Here&apos;s what&apos;s happening with your clinical activity today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Users size={20} />} label="Total Patients" value={stats.total_patients} color="blue" />
        <StatCard icon={<Brain size={20} />} label="Scans Analyzed" value={stats.total_scans} color="purple" />
        <StatCard icon={<Target size={20} />} label="AI Accuracy" value={`${stats.ai_accuracy}%`} color="emerald" />
        <StatCard icon={<Activity size={20} />} label="Recent Scans" value={stats.recent_scans.length} color="amber" />
      </div>

      {/* Charts & Recent */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AccuracyChart accuracy={stats.ai_accuracy} totalScans={stats.total_scans} />
        <RecentScans scans={stats.recent_scans} />
      </div>

      <p className="mt-10 text-center text-[11px] text-slate-300">
        This tool is for decision-support only and is not intended for medical diagnosis.
      </p>
    </div>
  );
}
