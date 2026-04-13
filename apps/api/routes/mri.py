from fastapi import APIRouter, Depends, UploadFile, File, Form

from models.schemas import MRIScanResponse, AnalyzeRequest, AnalyzeResponse, DashboardStats
from services.auth_service import get_current_user
from services.mri_service import upload_scan, analyze_scan, get_scans_for_patient, get_dashboard_stats, get_scan_by_id

router = APIRouter()


def _format_scan(row: dict) -> dict:
    return {**row, "id": str(row["id"]), "patient_id": str(row["patient_id"])}


@router.post("/upload", response_model=MRIScanResponse, status_code=201)
async def upload_mri(
    patient_id: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    row = await upload_scan(patient_id, user["id"], file)
    return _format_scan(row)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_mri(body: AnalyzeRequest, user: dict = Depends(get_current_user)):
    return await analyze_scan(body.scan_id, user["id"])


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(user: dict = Depends(get_current_user)):
    stats = await get_dashboard_stats(user["id"])
    stats["recent_scans"] = [_format_scan(s) for s in stats["recent_scans"]]
    return stats


@router.get("/scan/{scan_id}", response_model=MRIScanResponse)
async def get_single_scan(scan_id: str, user: dict = Depends(get_current_user)):
    row = await get_scan_by_id(scan_id, user["id"])
    return _format_scan(row)


@router.get("/{patient_id}", response_model=list[MRIScanResponse])
async def get_patient_scans(patient_id: str, user: dict = Depends(get_current_user)):
    rows = await get_scans_for_patient(patient_id, user["id"])
    return [_format_scan(r) for r in rows]
