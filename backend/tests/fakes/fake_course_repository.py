from uuid import uuid4

from repositories.course_repository import CourseRepository


class FakeCourseRepository(CourseRepository):
    def __init__(self):
        self._store: dict[str, dict] = {}

    async def list_courses(self, filters: dict | None = None) -> list[dict]:
        return list(self._store.values())

    async def get_course(self, course_id: str) -> dict | None:
        return self._store.get(course_id)
