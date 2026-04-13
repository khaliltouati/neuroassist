from fastapi import APIRouter, Depends

from models.schemas import PatientCreate, PatientUpdate, PatientResponse
from services.auth_service import get_current_user
from services.patient_service import list_patients, create_patient, get_patient, update_patient

router = APIRouter()


def _format(row: dict) -> dict:
    return {**row, "id": str(row["id"]), "doctor_id": str(row["doctor_id"])}


@router.get("", response_model=list[PatientResponse])
async def get_patients(user: dict = Depends(get_current_user)):
    rows = await list_patients(user["id"])
    return [_format(r) for r in rows]


@router.post("", response_model=PatientResponse, status_code=201)
async def add_patient(body: PatientCreate, user: dict = Depends(get_current_user)):
    row = await create_patient(user["id"], body.name, body.age, body.notes)
    return _format(row)


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient_detail(patient_id: str, user: dict = Depends(get_current_user)):
    row = await get_patient(patient_id, user["id"])
    return _format(row)


@router.put("/{patient_id}", response_model=PatientResponse)
async def edit_patient(patient_id: str, body: PatientUpdate, user: dict = Depends(get_current_user)):
    row = await update_patient(patient_id, user["id"], body.name, body.age, body.notes)
    return _format(row)
