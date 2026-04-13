"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { Plus, User, ChevronRight, Search } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  notes: string;
  created_at: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createPatient(form.name, parseInt(form.age), form.notes);
      setShowModal(false);
      setForm({ name: "", age: "", notes: "" });
      await loadPatients();
    } finally {
      setSaving(false);
    }
  }

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patients</h1>
          <p className="mt-1 text-sm text-slate-400">Manage your patient records</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-500 hover:shadow-md active:scale-[0.98]"
        >
          <Plus size={16} /> Add Patient
        </button>
      </div>

      {/* Search bar */}
      {patients.length > 0 && (
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 shadow-card outline-none placeholder:text-slate-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-600 border-t-transparent" />
        </div>
      ) : patients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <User className="text-slate-300" size={32} />
          </div>
          <p className="font-medium text-slate-500">No patients yet</p>
          <p className="mt-1 text-sm text-slate-400">Click &quot;Add Patient&quot; to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <Link
              key={p.id}
              href={`/dashboard/patients/${p.id}`}
              className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-card transition-all hover:shadow-card-hover"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white shadow-sm">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="text-[13px] text-slate-400">
                    Age {p.age} &middot; {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
              <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-brand-500 to-brand-300 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-slate-400">
              No patients matching &quot;{search}&quot;
            </div>
          )}
        </div>
      )}

      {/* Create Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg animate-slide-up rounded-2xl bg-white p-7 shadow-xl">
            <h2 className="mb-6 text-xl font-bold tracking-tight text-slate-900">New Patient</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Full Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-card outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Age</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={199}
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-card outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-card outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Create Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
