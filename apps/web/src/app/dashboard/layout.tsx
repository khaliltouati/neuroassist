"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <DashboardNav />
      <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
