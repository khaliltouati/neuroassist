import os
import uuid

from fastapi import HTTPException, UploadFile, status

from config import settings
from database import get_pool
from ai_model.inference import run_inference


ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


async def upload_scan(patient_id: str, doctor_id: str, file: UploadFile) -> dict:
    # Verify patient belongs to doctor
    pool = await get_pool()
    async with pool.acquire() as conn:
        patient = await conn.fetchrow(
            "SELECT id FROM patients WHERE id = $1 AND doctor_id = $2", patient_id, doctor_id
        )
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    # Validate file
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image format")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large (max 20MB)")

    # Save file
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    # Insert scan record
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO mri_scans (patient_id, image_path) VALUES ($1, $2) RETURNING *",
            patient_id, f"/uploads/{filename}",
        )
    return dict(row)


async def analyze_scan(scan_id: str, doctor_id: str) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT s.* FROM mri_scans s
               JOIN patients p ON s.patient_id = p.id
               WHERE s.id = $1 AND p.doctor_id = $2""",
            scan_id, doctor_id,
        )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")

    image_path = row["image_path"].lstrip("/")
    if not os.path.exists(image_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image file missing")

    # Run AI inference
    result = run_inference(image_path, scan_id)

    # Update DB
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE mri_scans SET prediction = $1, confidence = $2, heatmap_path = $3 WHERE id = $4",
            result["prediction"], result["confidence"], result["heatmap_url"], scan_id,
        )

    return result


async def get_scans_for_patient(patient_id: str, doctor_id: str) -> list[dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        patient = await conn.fetchrow(
            "SELECT id FROM patients WHERE id = $1 AND doctor_id = $2", patient_id, doctor_id
        )
        if not patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

        rows = await conn.fetch(
            "SELECT * FROM mri_scans WHERE patient_id = $1 ORDER BY created_at DESC", patient_id
        )
    return [dict(r) for r in rows]


async def get_scan_by_id(scan_id: str, doctor_id: str) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT s.* FROM mri_scans s
               JOIN patients p ON s.patient_id = p.id
               WHERE s.id = $1 AND p.doctor_id = $2""",
            scan_id, doctor_id,
        )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    return dict(row)


async def get_dashboard_stats(doctor_id: str) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        total_patients = await conn.fetchval(
            "SELECT COUNT(*) FROM patients WHERE doctor_id = $1", doctor_id
        )
        total_scans = await conn.fetchval(
            """SELECT COUNT(*) FROM mri_scans s
               JOIN patients p ON s.patient_id = p.id
               WHERE p.doctor_id = $1 AND s.prediction IS NOT NULL""",
            doctor_id,
        )
        feedback_stats = await conn.fetchrow(
            """SELECT COUNT(*) as total,
                      SUM(CASE WHEN f.is_correct THEN 1 ELSE 0 END) as correct
               FROM ai_feedback f WHERE f.doctor_id = $1""",
            doctor_id,
        )
        recent = await conn.fetch(
            """SELECT s.* FROM mri_scans s
               JOIN patients p ON s.patient_id = p.id
               WHERE p.doctor_id = $1 AND s.prediction IS NOT NULL
               ORDER BY s.created_at DESC LIMIT 10""",
            doctor_id,
        )

    total_feedback = feedback_stats["total"] or 0
    correct_feedback = feedback_stats["correct"] or 0
    accuracy = (correct_feedback / total_feedback * 100) if total_feedback > 0 else 0.0

    return {
        "total_patients": total_patients,
        "total_scans": total_scans,
        "ai_accuracy": round(accuracy, 1),
        "recent_scans": [dict(r) for r in recent],
    }
