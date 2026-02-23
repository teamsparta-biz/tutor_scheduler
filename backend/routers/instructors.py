from fastapi import APIRouter, Depends

from dependencies import get_instructor_service, get_assignment_service, get_instructor_course_service
from schemas.instructor import InstructorCreate, InstructorUpdate, InstructorResponse
from services.instructor_service import InstructorService
from services.assignment_service import AssignmentService
from services.instructor_course_service import InstructorCourseService

router = APIRouter(prefix="/instructors", tags=["instructors"])


@router.get("/available", response_model=list[InstructorResponse])
async def get_available_instructors(
    date: str,
    service: AssignmentService = Depends(get_assignment_service),
):
    return await service.get_available_instructors(date)


@router.get("", response_model=list[InstructorResponse])
async def list_instructors(
    is_active: bool | None = None,
    service: InstructorService = Depends(get_instructor_service),
):
    return await service.list_instructors(is_active=is_active)


@router.get("/{instructor_id}", response_model=InstructorResponse)
async def get_instructor(
    instructor_id: str,
    service: InstructorService = Depends(get_instructor_service),
):
    return await service.get_instructor(instructor_id)


@router.get("/{instructor_id}/courses")
async def list_instructor_courses(
    instructor_id: str,
    page: int = 1,
    page_size: int = 10,
    service: InstructorCourseService = Depends(get_instructor_course_service),
):
    return await service.list_courses_for_instructor(instructor_id, page, page_size)


@router.post("", response_model=InstructorResponse, status_code=201)
async def create_instructor(
    data: InstructorCreate,
    service: InstructorService = Depends(get_instructor_service),
):
    return await service.create_instructor(data)


@router.put("/{instructor_id}", response_model=InstructorResponse)
async def update_instructor(
    instructor_id: str,
    data: InstructorUpdate,
    service: InstructorService = Depends(get_instructor_service),
):
    return await service.update_instructor(instructor_id, data)


@router.delete("/{instructor_id}", status_code=204)
async def delete_instructor(
    instructor_id: str,
    service: InstructorService = Depends(get_instructor_service),
):
    await service.delete_instructor(instructor_id)
