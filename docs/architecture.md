# NeuroAssist AI — Architecture

> **Disclaimer:** This project is for educational and research purposes only and is not intended for medical diagnosis.

---

## System Overview

NeuroAssist AI is a **clinical MRI decision-support web application** composed of three main layers:

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                            │
│   Next.js 14 · React · TypeScript · TailwindCSS · Chart.js          │
└────────────────────────────┬─────────────────────────────────────────┘
                             │  REST / JSON
┌────────────────────────────▼─────────────────────────────────────────┐
│                       API Layer (FastAPI)                             │
│   JWT Auth · Pydantic validation · Route → Service → DB              │
│   ┌────────────────────────────────────────────────┐                 │
│   │          AI Inference Engine                    │                 │
│   │   Custom CNN · Grad-CAM heatmaps · Keras 3      │                 │
│   └────────────────────────────────────────────────┘                 │
└────────────────────────────┬─────────────────────────────────────────┘
                             │  asyncpg
┌────────────────────────────▼─────────────────────────────────────────┐
│                     PostgreSQL 15+                                    │
│   users · patients · mri_scans · ai_feedback                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Authentication
1. Doctor registers or logs in via the web frontend or mobile app.
2. FastAPI hashes password with bcrypt and issues a JWT (HS256, 24h expiry).
3. JWT is stored in `localStorage` (web) or `SharedPreferences` (mobile) and sent as `Authorization: Bearer <token>` on every request.
4. The `get_current_user` dependency verifies the token and resolves the doctor's record.

### MRI Analysis Pipeline
1. Doctor uploads an MRI image from a patient profile page (web) or captures/picks from gallery (mobile).
2. The backend validates file type and size, saves to `/uploads/`, and inserts a `mri_scans` record.
3. Doctor clicks **Run AI Analysis**.
4. Backend loads the image, converts to grayscale, resizes to 64×64, normalizes to [0, 1].
5. The CNN model predicts one of four classes: `glioma`, `meningioma`, `no_tumor`, `pituitary`.
6. Grad-CAM heatmap is generated and overlaid on the original image, saved to `/heatmaps/`.
7. The scan record is updated with `prediction`, `confidence`, and `heatmap_path`.
8. Results are rendered in the web frontend or mobile app with the original MRI, heatmap overlay, prediction badge, confidence bar, and explanation text.

### Feedback Loop
1. After reviewing AI results, the doctor marks the prediction as **Correct** or **Incorrect** and optionally adds a comment.
2. Feedback is stored in the `ai_feedback` table linked to the scan and doctor.
3. Dashboard accuracy is recalculated from all feedback records.
4. This data can be used for model retraining.

---

## Frontend Architecture

### Web (Next.js)

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/login` | Doctor login |
| `/register` | Doctor registration |
| `/dashboard` | Analytics dashboard (protected) |
| `/dashboard/patients` | Patient list + create modal |
| `/dashboard/patients/[id]` | Patient detail, scan upload, scan list |
| `/dashboard/scans/[id]` | MRI result viewer with heatmap + feedback |

### Key Components
- `DashboardNav` — Sidebar navigation with brand, links, and logout.
- `StatCard` — Metric card with icon and colored theme.
- `AccuracyChart` — Doughnut chart (Chart.js) showing AI accuracy from feedback.
- `RecentScans` — List of recent analyzed scans with prediction badges.

### API Client
A single `api.ts` service handles all HTTP communication, automatically injects JWT tokens, manages FormData for file uploads, and provides typed responses.

### Mobile (Flutter)

| Screen | Purpose |
|---|---|
| Login | Doctor login |
| Register | Doctor registration |
| Dashboard | Stats overview + recent scans (bottom tab) |
| Patients | Patient list with search + create (bottom tab) |
| Patient Profile | Patient info, scan grid, upload (gallery/camera), analyze |
| Scan Result | MRI viewer, Grad-CAM toggle, prediction + confidence, feedback |

#### Architecture
- **State management** — Provider (`ChangeNotifier`) for auth state, `context.read<ApiService>()` for API calls.
- **Navigation** — `onGenerateRoute` with named routes, `IndexedStack` bottom navigation shell.
- **Auth persistence** — JWT token + user data stored in `SharedPreferences`, auto-login on app start.
- **MRI capture** — `image_picker` for gallery selection and camera capture, multipart upload via `http`.
- **Connectivity** — Physical device via `adb reverse tcp:8001 tcp:8001`; emulator via `10.0.2.2`.

```
apps/mobile/lib/
├── core/
│   ├── constants.dart   # Base URL, storage keys
│   └── theme.dart       # Material 3 theme (indigo brand)
├── models/
│   ├── user.dart        # User, AuthResponse
│   ├── patient.dart     # Patient
│   └── scan.dart        # MriScan, AnalyzeResponse, DashboardStats
├── services/
│   ├── api_service.dart  # Full REST client (all endpoints)
│   └── auth_provider.dart # Auth state + auto-login
├── features/
│   ├── auth/            # LoginScreen, RegisterScreen
│   ├── dashboard/       # DashboardScreen
│   ├── patients/        # PatientsScreen, PatientProfileScreen
│   └── scans/           # ScanResultScreen (with feedback)
├── widgets/
│   └── stat_card.dart   # Reusable stat card
└── main.dart            # App entry, Provider wiring, routing
```

---

## Backend Architecture

```
apps/api/
├── main.py           # FastAPI app, CORS, lifespan, router registration
├── config.py         # Environment settings via dotenv
├── database.py       # asyncpg connection pooling
├── ai_model/
│   ├── inference.py   # Model loading, prediction, Grad-CAM orchestration
│   ├── preprocessing.py # Image load → resize → normalize
│   └── gradcam.py     # Grad-CAM heatmap generation + overlay
├── models/
│   └── schemas.py     # Pydantic request/response schemas
├── routes/
│   ├── auth.py        # /api/auth/*
│   ├── patients.py    # /api/patients/*
│   ├── mri.py         # /api/mri/*
│   └── feedback.py    # /api/feedback
└── services/
    ├── auth_service.py     # bcrypt, JWT, user CRUD
    ├── patient_service.py  # Patient CRUD
    ├── mri_service.py      # Upload, analyze, dashboard stats
    └── feedback_service.py # Create/update feedback
```

Each route delegates to a service; services interact with the database via asyncpg.

---

## Database Schema

Four tables with UUID primary keys and cascading deletes:

- **users** — Doctor accounts (email, password_hash, name)
- **patients** — Linked to a doctor (name, age, notes)
- **mri_scans** — Linked to a patient (image_path, prediction, confidence, heatmap_path)
- **ai_feedback** — Linked to a scan + doctor (is_correct, comment)

---

## AI Model Details

| Property | Value |
|---|---|
| Architecture | Custom CNN (2× Conv2D + Dense, ~1.6M params) |
| Input | 64 × 64 × 1 (grayscale, normalized to [0,1]) |
| Output | 4-class softmax (glioma, meningioma, no_tumor, pituitary) |
| Format | Keras 3 native `.keras` |
| Heatmap | Grad-CAM on last Conv2D layer |
| Demo mode | If no trained weights exist, a matching CNN architecture runs with random weights |

---

## Deployment

### Docker Compose
A single `docker-compose up --build` starts the backend services:
- **db** — PostgreSQL 15, auto-initializes schema
- **api** — FastAPI on port 8000
- **web** — Next.js on port 3000

### Mobile App
The Flutter mobile app connects to the same backend API:
- **USB debugging** — `adb reverse tcp:8001 tcp:8001`, then `flutter run`
- **Wi-Fi** — Set `baseUrl` in `lib/core/constants.dart` to the PC's LAN IP
- **Emulator** — Uses `10.0.2.2` to reach host localhost

### Manual Setup
See the root `README.md` for step-by-step local setup instructions.
