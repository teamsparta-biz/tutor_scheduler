from fastapi import APIRouter, Depends

from dependencies import get_calendar_service
from schemas.calendar import CalendarResponse
from services.calendar_service import CalendarService

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("", response_model=CalendarResponse)
async def get_calendar(
    start_date: str,
    end_date: str,
    service: CalendarService = Depends(get_calendar_service),
):
    return await service.get_calendar(start_date, end_date)
