import { ReactNode } from "react";

const colorMap: Record<string, { bg: string; text: string; icon: string; gradient: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500", gradient: "from-blue-500 to-blue-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", icon: "text-purple-500", gradient: "from-purple-500 to-purple-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-500", gradient: "from-emerald-500 to-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-500", gradient: "from-amber-500 to-amber-600" },
};

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  color: string;
}

export default function StatCard({ icon, label, value, color }: StatCardProps) {
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-card transition-all hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold tracking-tight ${c.text}`}>{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${c.gradient} text-white shadow-sm`}>
          {icon}
        </div>
      </div>
      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r ${c.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
    </div>
  );
}
