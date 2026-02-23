from uuid import uuid4

from repositories.course_repository import CourseRepository


class FakeCourseRepository(CourseRepository):
    def __init__(self):
        self._store: dict[str, dict] = {}

    async def list_courses(self, filters: dict | None = None) -> list[dict]:
        return list(self._store.values())

    async def get_course(self, course_id: str) -> dict | None:
        return self._store.get(course_id)

    async def create_course(self, data: dict) -> dict:
        course = {"id": str(uuid4()), **data}
        self._store[course["id"]] = course
        return course

    async def update_course(self, course_id: str, data: dict) -> dict:
        self._store[course_id].update(data)
        return self._store[course_id]

    async def delete_course(self, course_id: str) -> bool:
        return self._store.pop(course_id, None) is not None

    async def upsert_course(self, data: dict) -> dict:
        for item in self._store.values():
            if item.get("notion_page_id") == data.get("notion_page_id"):
                item.update(data)
                return item
        return await self.create_course(data)
