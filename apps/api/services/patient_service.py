from fastapi import HTTPException, status
from database import get_pool


async def list_patients(doctor_id: str) -> list[dict]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, doctor_id, name, age, notes, created_at FROM patients WHERE doctor_id = $1 ORDER BY created_at DESC",
            doctor_id,
        )
    return [dict(r) for r in rows]


async def create_patient(doctor_id: str, name: str, age: int, notes: str) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO patients (doctor_id, name, age, notes) VALUES ($1, $2, $3, $4) RETURNING *",
            doctor_id, name, age, notes,
        )
    return dict(row)


async def get_patient(patient_id: str, doctor_id: str) -> dict:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM patients WHERE id = $1 AND doctor_id = $2",
            patient_id, doctor_id,
        )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return dict(row)


async def update_patient(patient_id: str, doctor_id: str, name: str | None, age: int | None, notes: str | None) -> dict:
    patient = await get_patient(patient_id, doctor_id)

    updated_name = name if name is not None else patient["name"]
    updated_age = age if age is not None else patient["age"]
    updated_notes = notes if notes is not None else patient["notes"]

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE patients SET name = $1, age = $2, notes = $3 WHERE id = $4 AND doctor_id = $5 RETURNING *",
            updated_name, updated_age, updated_notes, patient_id, doctor_id,
        )
    return dict(row)
