const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Only set Content-Type for JSON bodies (not FormData)
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new ApiError(body.detail || `Error ${res.status}`, res.status);
  }

  return res.json();
}

// ── Types ──────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  name: string;
}

export interface Patient {
  id: string;
  doctor_id: string;
  name: string;
  age: number;
  notes: string;
  created_at: string;
}

export interface MRIScan {
  id: string;
  patient_id: string;
  image_path: string;
  prediction: string | null;
  confidence: number | null;
  heatmap_path: string | null;
  created_at: string;
}

export interface AnalyzeResponse {
  prediction: string;
  confidence: number;
  heatmap_url: string;
  explanation: string;
}

export interface FeedbackResponse {
  id: string;
  mri_scan_id: string;
  doctor_id: string;
  is_correct: boolean;
  comment: string;
  created_at: string;
}

export interface DashboardStats {
  total_patients: number;
  total_scans: number;
  ai_accuracy: number;
  recent_scans: MRIScan[];
}

// ── API Client ─────────────────────────────────────

export const api = {
  // Auth
  login(email: string, password: string) {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(name: string, email: string, password: string) {
    return request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  // Dashboard
  getDashboard() {
    return request<DashboardStats>("/api/mri/dashboard");
  },

  // Patients
  getPatients() {
    return request<Patient[]>("/api/patients");
  },

  createPatient(name: string, age: number, notes: string) {
    return request<Patient>("/api/patients", {
      method: "POST",
      body: JSON.stringify({ name, age, notes }),
    });
  },

  getPatient(id: string) {
    return request<Patient>(`/api/patients/${id}`);
  },

  updatePatient(id: string, data: { name?: string; age?: number; notes?: string }) {
    return request<Patient>(`/api/patients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // MRI Scans
  getScans(patientId: string) {
    return request<MRIScan[]>(`/api/mri/${patientId}`);
  },

  getScan(scanId: string) {
    return request<MRIScan>(`/api/mri/scan/${scanId}`);
  },

  uploadScan(patientId: string, file: File) {
    const formData = new FormData();
    formData.append("patient_id", patientId);
    formData.append("file", file);
    return request<MRIScan>("/api/mri/upload", {
      method: "POST",
      body: formData,
    });
  },

  analyzeScan(scanId: string) {
    return request<AnalyzeResponse>("/api/mri/analyze", {
      method: "POST",
      body: JSON.stringify({ scan_id: scanId }),
    });
  },

  // Feedback
  submitFeedback(mriScanId: string, isCorrect: boolean, comment: string) {
    return request<FeedbackResponse>("/api/feedback", {
      method: "POST",
      body: JSON.stringify({ mri_scan_id: mriScanId, is_correct: isCorrect, comment }),
    });
  },
};
