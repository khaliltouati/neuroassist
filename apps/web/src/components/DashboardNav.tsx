"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Brain,
  LogOut,
  ChevronRight,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/patients", label: "Patients", icon: Users },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  }

  const user = (() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  return (
    <aside className="flex w-[260px] flex-col border-r border-slate-200/60 bg-white/80 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
          <Brain className="text-white" size={20} />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900">
          Neuro<span className="text-brand-600">Assist</span>
        </span>
      </div>

      {/* Links */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Menu
        </p>
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
                active
                  ? "bg-brand-50 text-brand-700 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} className="text-brand-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-slate-100 p-4">
        {user && (
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user.name || "Doctor"}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {user.email || ""}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-500"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
