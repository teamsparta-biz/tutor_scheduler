from repositories.course_repository import CourseRepository
from clients.supabase_client import SupabaseClient


class SupabaseCourseRepository(CourseRepository):
    """Supabase 로컬 캐시 CRUD"""

    def __init__(self, client: SupabaseClient):
        self._client = client

    async def list_courses(self, filters: dict | None = None) -> list[dict]:
        raise NotImplementedError("task 40에서 구현")

    async def get_course(self, course_id: str) -> dict | None:
        raise NotImplementedError("task 40에서 구현")
