from uuid import uuid4

from repositories.instructor_repository import InstructorRepository


class FakeInstructorRepository(InstructorRepository):
    def __init__(self):
        self._store: dict[str, dict] = {}

    async def list_instructors(self, is_active: bool | None = None) -> list[dict]:
        items = list(self._store.values())
        if is_active is not None:
            items = [i for i in items if i["is_active"] == is_active]
        return items

    async def get_instructor(self, instructor_id: str) -> dict | None:
        return self._store.get(instructor_id)

    async def create_instructor(self, data: dict) -> dict:
        instructor = {"id": str(uuid4()), **data}
        self._store[instructor["id"]] = instructor
        return instructor

    async def update_instructor(self, instructor_id: str, data: dict) -> dict:
        self._store[instructor_id].update(data)
        return self._store[instructor_id]

    async def delete_instructor(self, instructor_id: str) -> bool:
        return self._store.pop(instructor_id, None) is not None
