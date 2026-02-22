from repositories.assignment_repository import AssignmentRepository
from clients.supabase_client import SupabaseClient


class SupabaseAssignmentRepository(AssignmentRepository):
    """Supabase 기반 강사 배정 관리"""

    def __init__(self, client: SupabaseClient):
        self._client = client

    async def list_assignments(self, filters: dict | None = None) -> list[dict]:
        raise NotImplementedError("task 50에서 구현")

    async def create_assignment(self, data: dict) -> dict:
        raise NotImplementedError("task 50에서 구현")

    async def delete_assignment(self, assignment_id: str) -> bool:
        raise NotImplementedError("task 50에서 구현")
