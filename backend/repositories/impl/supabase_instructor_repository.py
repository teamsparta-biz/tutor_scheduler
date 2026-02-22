from repositories.instructor_repository import InstructorRepository
from clients.supabase_client import SupabaseClient


class SupabaseInstructorRepository(InstructorRepository):
    """Supabase 기반 강사 CRUD"""

    def __init__(self, client: SupabaseClient):
        self._client = client

    async def list_instructors(self, is_active: bool | None = None) -> list[dict]:
        raise NotImplementedError("task 30에서 구현")

    async def get_instructor(self, instructor_id: str) -> dict | None:
        raise NotImplementedError("task 30에서 구현")

    async def create_instructor(self, data: dict) -> dict:
        raise NotImplementedError("task 30에서 구현")

    async def update_instructor(self, instructor_id: str, data: dict) -> dict:
        raise NotImplementedError("task 30에서 구현")

    async def delete_instructor(self, instructor_id: str) -> bool:
        raise NotImplementedError("task 30에서 구현")
