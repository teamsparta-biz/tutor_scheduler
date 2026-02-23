from repositories.course_date_repository import CourseDateRepository
from clients.supabase_client import SupabaseClient


class SupabaseCourseDateRepository(CourseDateRepository):
    """Supabase 기반 교육 날짜 관리"""

    def __init__(self, client: SupabaseClient):
        self._client = client

    async def list_dates_by_course(self, course_id: str) -> list[dict]:
        result = (
            self._client.table("course_dates")
            .select("*")
            .eq("course_id", course_id)
            .order("date")
            .execute()
        )
        return result.data

    async def create_dates(self, course_id: str, dates: list[dict]) -> list[dict]:
        rows = [{"course_id": course_id, **d} for d in dates]
        result = self._client.table("course_dates").insert(rows).execute()
        return result.data

    async def delete_date(self, date_id: str) -> bool:
        result = (
            self._client.table("course_dates")
            .delete()
            .eq("id", date_id)
            .execute()
        )
        return len(result.data) > 0
