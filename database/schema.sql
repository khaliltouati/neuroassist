-- NeuroAssist AI Database Schema
-- PostgreSQL

-- Note: When using Docker Compose, the database is created automatically.
-- For manual setup, run: CREATE DATABASE neuroassist; and connect to it first.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (Doctors)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age INTEGER CHECK (age > 0 AND age < 200),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_patients_doctor ON patients(doctor_id);

-- MRI Scans
CREATE TABLE mri_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    image_path VARCHAR(512) NOT NULL,
    prediction VARCHAR(50),
    confidence REAL,
    heatmap_path VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mri_scans_patient ON mri_scans(patient_id);

-- AI Feedback
CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mri_scan_id UUID NOT NULL REFERENCES mri_scans(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL,
    comment TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_scan ON ai_feedback(mri_scan_id);
CREATE INDEX idx_feedback_doctor ON ai_feedback(doctor_id);
