# NeuroAssist AI

> **Disclaimer:** This project is for educational and research purposes only and is not intended for medical diagnosis.

NeuroAssist AI is a clinical MRI decision-support web application. Doctors upload MRI scans, run AI-powered analysis, manage patients, and provide feedback to improve the model over time.

This is a **decision-support tool** — not a medical diagnosis system.

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│  Next.js UI  │────▶│  FastAPI      │────▶│  PostgreSQL    │
│  (React/TS)  │◀────│  Backend      │◀────│  Database      │
└─────────────┘     └──────┬───────┘     └────────────────┘
                           │
                    ┌──────▼───────┐
                    │  TensorFlow  │
                    │  AI Engine   │
                    └──────────────┘
```

- **Frontend** — Next.js 14+ (App Router), TailwindCSS, TypeScript, Chart.js
- **Backend** — Python FastAPI, JWT auth, bcrypt hashing
- **AI** — TensorFlow / Keras 3, Grad-CAM heatmaps
- **Database** — PostgreSQL
- **Storage** — Local filesystem (`/uploads`, `/heatmaps`)

---

## Project Structure

```
neuroassist/
├── apps/
│   ├── api/           # FastAPI backend
│   │   ├── ai_model/  # AI inference + Grad-CAM
│   │   ├── models/    # Pydantic schemas
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Business logic
│   │   ├── main.py
│   │   └── config.py
│   └── web/           # Next.js frontend
│       ├── src/
│       │   ├── app/        # App Router pages
│       │   ├── components/ # Reusable UI
│       │   └── services/   # API client
│       └── package.json
├── database/
│   └── schema.sql
├── docs/
│   └── architecture.md
├── docker-compose.yml
└── README.md
```

---

## AI Model

The inference engine uses a custom CNN trained for brain MRI classification, loaded via Keras 3 (`.keras` format).

**Classes (alphabetical order, matching training):**
| Label | Description |
|---|---|
| `glioma` | Glioma tumor detected |
| `meningioma` | Meningioma tumor detected |
| `no_tumor` | No tumor detected |
| `pituitary` | Pituitary tumor detected |

Images are converted to **grayscale** and resized to **64×64** before inference. A **Grad-CAM** heatmap is generated to visualize which regions influenced the prediction.

### Dataset Example

This model can be trained on the [Brain Tumor MRI Dataset](https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset) from Kaggle, which contains ~7000 images across the four classes.

To use a custom model, place your `.keras` file in `apps/api/ai_model/weights/` and update the path in `.env`.

---

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- (Optional) Docker & Docker Compose

### 1. Database

```sql
psql -U postgres -f database/schema.sql
```

### 2. Backend

```bash
cd apps/api
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
cp .env.example .env         # Edit with your DB credentials
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd apps/web
npm install
cp .env.example .env.local   # Edit API URL
npm run dev
```

### 4. Docker (Alternative)

```bash
docker-compose up --build
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new doctor |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/patients` | List doctor's patients |
| POST | `/api/patients` | Create patient |
| GET | `/api/patients/{id}` | Patient detail + scans |
| POST | `/api/mri/upload` | Upload MRI image |
| POST | `/api/mri/analyze` | Run AI analysis |
| GET | `/api/mri/{patient_id}` | Get scans for patient |
| POST | `/api/feedback` | Submit doctor feedback |

---

## Environment Variables

### Backend (`apps/api/.env`)

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/neuroassist
JWT_SECRET=your-secret-key
MODEL_PATH=ai_model/weights/brain_tumor_classifier.keras
UPLOAD_DIR=uploads
HEATMAP_DIR=heatmaps
```

### Frontend (`apps/web/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## License

MIT
