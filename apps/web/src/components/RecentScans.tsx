import Link from "next/link";
import type { MRIScan } from "@/services/api";

const predictionColors: Record<string, string> = {
  glioma: "bg-red-100 text-red-700",
  meningioma: "bg-orange-100 text-orange-700",
  pituitary: "bg-yellow-100 text-yellow-700",
  no_tumor: "bg-emerald-100 text-emerald-700",
};

interface RecentScansProps {
  scans: MRIScan[];
}

export default function RecentScans({ scans }: RecentScansProps) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Recent Analyses</h3>
          <p className="mt-0.5 text-xs text-slate-400">Latest MRI scan results</p>
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">
          No scans analyzed yet
        </div>
      ) : (
        <div className="space-y-1">
          {scans.slice(0, 8).map((scan, i) => (
            <Link
              key={scan.id}
              href={`/dashboard/scans/${scan.id}`}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-all hover:bg-slate-50"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/60">
                  {scan.image_path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${scan.image_path}`}
                      alt="MRI"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-slate-700">
                    Scan {scan.id.slice(0, 8)}…
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(scan.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                {scan.prediction && (
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                      predictionColors[scan.prediction] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {scan.prediction.replace("_", " ")}
                  </span>
                )}
                {scan.confidence != null && (
                  <span className="text-xs font-semibold tabular-nums text-slate-500">
                    {(scan.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
