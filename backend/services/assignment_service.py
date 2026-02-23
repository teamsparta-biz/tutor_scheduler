from fastapi import HTTPException

from repositories.assignment_repository import AssignmentRepository
from repositories.instructor_repository import InstructorRepository
from repositories.availability_repository import AvailabilityRepository
from exceptions import DuplicateAssignmentError
from schemas.assignment import AssignmentCreate


class AssignmentService:
    def __init__(
        self,
        repository: AssignmentRepository,
        instructor_repo: InstructorRepository,
        availability_repo: AvailabilityRepository | None = None,
    ):
        self._repo = repository
        self._instructor_repo = instructor_repo
        self._availability_repo = availability_repo

    async def list_assignments(self, filters: dict | None = None) -> list[dict]:
        return await self._repo.list_assignments(filters=filters)

    async def create_assignment(self, data: AssignmentCreate) -> dict:
        existing = await self._repo.list_assignments(
            filters={"instructor_id": data.instructor_id, "date": str(data.date)}
        )
        if existing:
            raise DuplicateAssignmentError(
                f"강사 {data.instructor_id}는 {data.date}에 이미 배정됨"
            )
        return await self._repo.create_assignment(data.model_dump(mode="json"))

    async def delete_assignment(self, assignment_id: str) -> bool:
        return await self._repo.delete_assignment(assignment_id)

    async def get_available_instructors(self, date: str) -> list[dict]:
        all_instructors = await self._instructor_repo.list_instructors(is_active=True)
        assignments = await self._repo.list_assignments(filters={"date": date})
        assigned_ids = {a["instructor_id"] for a in assignments}

        # 불가일 체크
        unavailable_ids: set[str] = set()
        if self._availability_repo:
            unavails = await self._availability_repo.list_by_date_range(date, date)
            unavailable_ids = {a["instructor_id"] for a in unavails}

        return [
            i for i in all_instructors
            if i["id"] not in assigned_ids and i["id"] not in unavailable_ids
        ]
