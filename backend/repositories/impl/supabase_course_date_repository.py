from repositories.course_date_repository import CourseDateRepository
from clients.supabase_client import SupabaseClient


class SupabaseCourseDateRepository(CourseDateRepository):
    """Supabase 기반 교육 날짜 관리"""

    def __init__(self, client: SupabaseClient):
        self._client = client

    async def list_dates_by_course(self, course_id: str) -> list[dict]:
        raise NotImplementedError("task 40에서 구현")

    async def create_dates(self, course_id: str, dates: list[dict]) -> list[dict]:
        raise NotImplementedError("task 40에서 구현")

    async def delete_date(self, date_id: str) -> bool:
        raise NotImplementedError("task 40에서 구현")
