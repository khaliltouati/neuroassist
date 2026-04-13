from fastapi import APIRouter

from models.schemas import RegisterRequest, LoginRequest, AuthResponse
from services.auth_service import register_user, login_user

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest):
    return await register_user(body.email, body.password, body.name)


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    return await login_user(body.email, body.password)
