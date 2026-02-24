from fastapi import APIRouter, Depends

from dependencies import get_current_user
from schemas.auth import AuthMeResponse, UserProfile

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=AuthMeResponse)
async def get_me(user: UserProfile = Depends(get_current_user)):
    return AuthMeResponse(
        user_id=user.user_id,
        email=user.email,
        role=user.role,
        display_name=user.display_name,
        instructor_id=user.instructor_id,
    )
