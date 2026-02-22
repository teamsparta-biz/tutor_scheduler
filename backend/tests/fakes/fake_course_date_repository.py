from uuid import uuid4

from repositories.course_date_repository import CourseDateRepository


class FakeCourseDateRepository(CourseDateRepository):
    def __init__(self):
        self._store: dict[str, dict] = {}

    async def list_dates_by_course(self, course_id: str) -> list[dict]:
        return [d for d in self._store.values() if d["course_id"] == course_id]

    async def create_dates(self, course_id: str, dates: list[dict]) -> list[dict]:
        result = []
        for d in dates:
            item = {"id": str(uuid4()), "course_id": course_id, **d}
            self._store[item["id"]] = item
            result.append(item)
        return result

    async def delete_date(self, date_id: str) -> bool:
        return self._store.pop(date_id, None) is not None
