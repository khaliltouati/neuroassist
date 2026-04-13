from fastapi import HTTPException, status
from database import get_pool


async def create_feedback(doctor_id: str, mri_scan_id: str, is_correct: bool, comment: str) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Verify scan exists and belongs to doctor's patient
        scan = await conn.fetchrow(
            """SELECT s.id FROM mri_scans s
               JOIN patients p ON s.patient_id = p.id
               WHERE s.id = $1 AND p.doctor_id = $2""",
            mri_scan_id, doctor_id,
        )
        if not scan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")

        # Check for existing feedback
        existing = await conn.fetchrow(
            "SELECT id FROM ai_feedback WHERE mri_scan_id = $1 AND doctor_id = $2",
            mri_scan_id, doctor_id,
        )
        if existing:
            # Update existing feedback
            row = await conn.fetchrow(
                """UPDATE ai_feedback SET is_correct = $1, comment = $2
                   WHERE mri_scan_id = $3 AND doctor_id = $4 RETURNING *""",
                is_correct, comment, mri_scan_id, doctor_id,
            )
        else:
            row = await conn.fetchrow(
                """INSERT INTO ai_feedback (mri_scan_id, doctor_id, is_correct, comment)
                   VALUES ($1, $2, $3, $4) RETURNING *""",
                mri_scan_id, doctor_id, is_correct, comment,
            )
    return dict(row)
