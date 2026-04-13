from fastapi import APIRouter, Depends

from models.schemas import FeedbackCreate, FeedbackResponse
from services.auth_service import get_current_user
from services.feedback_service import create_feedback

router = APIRouter()


@router.post("", response_model=FeedbackResponse, status_code=201)
async def submit_feedback(body: FeedbackCreate, user: dict = Depends(get_current_user)):
    row = await create_feedback(user["id"], body.mri_scan_id, body.is_correct, body.comment)
    return {**row, "id": str(row["id"]), "mri_scan_id": str(row["mri_scan_id"]), "doctor_id": str(row["doctor_id"])}
