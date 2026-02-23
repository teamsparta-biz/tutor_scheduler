from repositories.course_repository import CourseRepository
from clients.supabase_client import SupabaseClient


class SupabaseCourseRepository(CourseRepository):
    """Supabase 로컬 캐시 CRUD"""

    def __init__(self, client: SupabaseClient):
        self._client = client

    async def list_courses(self, filters: dict | None = None) -> list[dict]:
        query = self._client.table("courses").select("*")
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        result = query.execute()
        return result.data

    async def get_course(self, course_id: str) -> dict | None:
        result = (
            self._client.table("courses")
            .select("*")
            .eq("id", course_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def create_course(self, data: dict) -> dict:
        result = self._client.table("courses").insert(data).execute()
        return result.data[0]

    async def update_course(self, course_id: str, data: dict) -> dict:
        result = (
            self._client.table("courses")
            .update(data)
            .eq("id", course_id)
            .execute()
        )
        return result.data[0]

    async def delete_course(self, course_id: str) -> bool:
        result = (
            self._client.table("courses")
            .delete()
            .eq("id", course_id)
            .execute()
        )
        return len(result.data) > 0

    async def upsert_course(self, data: dict) -> dict:
        result = (
            self._client.table("courses")
            .upsert(data, on_conflict="notion_page_id")
            .execute()
        )
        return result.data[0]
