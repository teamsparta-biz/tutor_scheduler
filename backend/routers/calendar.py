from fastapi import APIRouter, Depends

from dependencies import get_calendar_service, get_current_user
from schemas.auth import UserProfile
from schemas.calendar import CalendarResponse
from services.calendar_service import CalendarService

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("", response_model=CalendarResponse)
async def get_calendar(
    start_date: str,
    end_date: str,
    _user: UserProfile = Depends(get_current_user),
    service: CalendarService = Depends(get_calendar_service),
):
    return await service.get_calendar(start_date, end_date)
