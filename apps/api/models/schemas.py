from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ── Auth ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    name: str


# ── Patients ──────────────────────────────────────────

class PatientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    age: int = Field(gt=0, lt=200)
    notes: str = ""


class PatientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    age: Optional[int] = Field(None, gt=0, lt=200)
    notes: Optional[str] = None


class PatientResponse(BaseModel):
    id: str
    doctor_id: str
    name: str
    age: int
    notes: str
    created_at: datetime


# ── MRI Scans ─────────────────────────────────────────

class MRIScanResponse(BaseModel):
    id: str
    patient_id: str
    image_path: str
    prediction: Optional[str] = None
    confidence: Optional[float] = None
    heatmap_path: Optional[str] = None
    created_at: datetime


class AnalyzeRequest(BaseModel):
    scan_id: str


class AnalyzeResponse(BaseModel):
    prediction: str
    confidence: float
    heatmap_url: str
    explanation: str


# ── Feedback ──────────────────────────────────────────

class FeedbackCreate(BaseModel):
    mri_scan_id: str
    is_correct: bool
    comment: str = ""


class FeedbackResponse(BaseModel):
    id: str
    mri_scan_id: str
    doctor_id: str
    is_correct: bool
    comment: str
    created_at: datetime


# ── Dashboard ─────────────────────────────────────────

class DashboardStats(BaseModel):
    total_patients: int
    total_scans: int
    ai_accuracy: float
    recent_scans: list[MRIScanResponse]
