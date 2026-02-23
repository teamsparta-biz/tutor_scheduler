from repositories.instructor_repository import InstructorRepository
from clients.supabase_client import SupabaseClient


class SupabaseInstructorRepository(InstructorRepository):
    """Supabase 기반 강사 CRUD"""

    def __init__(self, client: SupabaseClient):
        self._client = client

    async def list_instructors(self, is_active: bool | None = None) -> list[dict]:
        query = self._client.table("instructors").select("*")
        if is_active is not None:
            query = query.eq("is_active", is_active)
        result = query.execute()
        return result.data

    async def get_instructor(self, instructor_id: str) -> dict | None:
        result = (
            self._client.table("instructors")
            .select("*")
            .eq("id", instructor_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def create_instructor(self, data: dict) -> dict:
        result = self._client.table("instructors").insert(data).execute()
        return result.data[0]

    async def update_instructor(self, instructor_id: str, data: dict) -> dict:
        result = (
            self._client.table("instructors")
            .update(data)
            .eq("id", instructor_id)
            .execute()
        )
        return result.data[0]

    async def delete_instructor(self, instructor_id: str) -> bool:
        result = (
            self._client.table("instructors")
            .delete()
            .eq("id", instructor_id)
            .execute()
        )
        return len(result.data) > 0
