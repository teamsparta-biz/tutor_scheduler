from uuid import uuid4

from repositories.assignment_repository import AssignmentRepository
from exceptions import DuplicateAssignmentError


class FakeAssignmentRepository(AssignmentRepository):
    def __init__(self):
        self._store: dict[str, dict] = {}
        self._unique_index: set[tuple[str, str]] = set()  # (instructor_id, date)

    async def list_assignments_by_date_range(self, start_date: str, end_date: str) -> list[dict]:
        return [
            a for a in self._store.values()
            if start_date <= str(a.get("date", "")) <= end_date
        ]

    async def list_assignments(self, filters: dict | None = None) -> list[dict]:
        items = list(self._store.values())
        if filters:
            for key, value in filters.items():
                items = [i for i in items if str(i.get(key)) == str(value)]
        return items

    async def create_assignment(self, data: dict) -> dict:
        key = (data["instructor_id"], str(data["date"]))
        if key in self._unique_index:
            raise DuplicateAssignmentError(
                f"강사 {key[0]}는 {key[1]}에 이미 배정됨"
            )
        self._unique_index.add(key)
        assignment = {"id": str(uuid4()), **data}
        self._store[assignment["id"]] = assignment
        return assignment

    async def delete_assignment(self, assignment_id: str) -> bool:
        item = self._store.pop(assignment_id, None)
        if item:
            key = (item["instructor_id"], str(item["date"]))
            self._unique_index.discard(key)
            return True
        return False
