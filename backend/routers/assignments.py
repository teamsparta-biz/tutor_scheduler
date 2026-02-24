from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from dependencies import get_assignment_service, get_current_user, require_admin
from exceptions import DuplicateAssignmentError
from schemas.auth import UserProfile
from schemas.assignment import AssignmentCreate, AssignmentResponse
from services.assignment_service import AssignmentService

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.get("", response_model=list[AssignmentResponse])
async def list_assignments(
    _user: UserProfile = Depends(get_current_user),
    service: AssignmentService = Depends(get_assignment_service),
):
    return await service.list_assignments()


@router.post("", response_model=AssignmentResponse, status_code=201)
async def create_assignment(
    data: AssignmentCreate,
    _admin: UserProfile = Depends(require_admin),
    service: AssignmentService = Depends(get_assignment_service),
):
    try:
        return await service.create_assignment(data)
    except DuplicateAssignmentError as e:
        return JSONResponse(status_code=400, content={"detail": str(e)})


@router.delete("/{assignment_id}", status_code=204)
async def delete_assignment(
    assignment_id: str,
    _admin: UserProfile = Depends(require_admin),
    service: AssignmentService = Depends(get_assignment_service),
):
    await service.delete_assignment(assignment_id)
