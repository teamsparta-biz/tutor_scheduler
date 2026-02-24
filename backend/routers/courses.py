from fastapi import APIRouter, Depends

from dependencies import get_course_service, get_course_sync_service, get_current_user, require_admin
from schemas.auth import UserProfile
from schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseDetailResponse,
    SyncResultResponse,
)
from services.course_service import CourseService
from services.course_sync_service import CourseSyncService

router = APIRouter(prefix="/courses", tags=["courses"])


@router.post("/sync", response_model=SyncResultResponse)
async def sync_courses(
    _admin: UserProfile = Depends(require_admin),
    service: CourseSyncService = Depends(get_course_sync_service),
):
    return await service.sync_courses()


@router.get("", response_model=list[CourseResponse])
async def list_courses(
    _user: UserProfile = Depends(get_current_user),
    service: CourseService = Depends(get_course_service),
):
    return await service.list_courses()


@router.get("/{course_id}", response_model=CourseDetailResponse)
async def get_course(
    course_id: str,
    _user: UserProfile = Depends(get_current_user),
    service: CourseService = Depends(get_course_service),
):
    return await service.get_course_detail(course_id)


@router.post("", response_model=CourseResponse, status_code=201)
async def create_course(
    data: CourseCreate,
    _admin: UserProfile = Depends(require_admin),
    service: CourseService = Depends(get_course_service),
):
    return await service.create_course(data)


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    data: CourseUpdate,
    _admin: UserProfile = Depends(require_admin),
    service: CourseService = Depends(get_course_service),
):
    return await service.update_course(course_id, data)


@router.delete("/{course_id}", status_code=204)
async def delete_course(
    course_id: str,
    _admin: UserProfile = Depends(require_admin),
    service: CourseService = Depends(get_course_service),
):
    await service.delete_course(course_id)
