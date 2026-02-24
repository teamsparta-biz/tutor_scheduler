from fastapi import APIRouter, Depends

from dependencies import get_availability_service, get_current_user
from exceptions import AuthorizationError
from schemas.auth import UserProfile
from schemas.availability import AvailabilityCreate, AvailabilityResponse
from services.availability_service import AvailabilityService

router = APIRouter(prefix="/availability", tags=["availability"])


@router.get("", response_model=list[AvailabilityResponse])
async def list_availability(
    instructor_id: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    user: UserProfile = Depends(get_current_user),
    service: AvailabilityService = Depends(get_availability_service),
):
    # 강사는 본인 데이터만 조회 가능
    if user.role == 'instructor':
        instructor_id = user.instructor_id

    if instructor_id and start_date and end_date:
        return await service.list_by_instructor_and_date_range(
            instructor_id, start_date, end_date,
        )
    elif instructor_id:
        return await service.list_by_instructor(instructor_id)
    elif start_date and end_date:
        return await service.list_by_date_range(start_date, end_date)
    return []


@router.post("", response_model=AvailabilityResponse, status_code=201)
async def create_availability(
    data: AvailabilityCreate,
    user: UserProfile = Depends(get_current_user),
    service: AvailabilityService = Depends(get_availability_service),
):
    # 강사는 본인 데이터만 생성 가능
    if user.role == 'instructor' and data.instructor_id != user.instructor_id:
        raise AuthorizationError("본인의 가용성만 등록할 수 있습니다")
    return await service.create(data)


@router.delete("/{availability_id}", status_code=204)
async def delete_availability(
    availability_id: str,
    _user: UserProfile = Depends(get_current_user),
    service: AvailabilityService = Depends(get_availability_service),
):
    await service.delete(availability_id)
