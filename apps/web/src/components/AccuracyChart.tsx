"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface AccuracyChartProps {
  accuracy: number;
  totalScans: number;
}

export default function AccuracyChart({ accuracy, totalScans }: AccuracyChartProps) {
  const data = {
    labels: ["Correct", "Incorrect"],
    datasets: [
      {
        data: [accuracy, Math.max(100 - accuracy, 0)],
        backgroundColor: ["#6366f1", "#e2e8f0"],
        hoverBackgroundColor: ["#4f46e5", "#cbd5e1"],
        borderWidth: 0,
        cutout: "78%",
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: number }) => `${ctx.parsed.toFixed(1)}%`,
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">AI Accuracy</h3>
          <p className="mt-0.5 text-xs text-slate-400">Based on doctor feedback</p>
        </div>
        <div className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600">
          {totalScans} scans
        </div>
      </div>

      {totalScans === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">
          No feedback data yet
        </div>
      ) : (
        <div className="relative mx-auto h-48 w-48">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tracking-tight text-slate-900">{accuracy}%</span>
            <span className="text-xs font-medium text-slate-400">accuracy</span>
          </div>
        </div>
      )}
    </div>
  );
}
