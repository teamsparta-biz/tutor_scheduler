from repositories.assignment_repository import AssignmentRepository
from clients.supabase_client import SupabaseClient
from exceptions import DuplicateAssignmentError


class SupabaseAssignmentRepository(AssignmentRepository):
    """Supabase 기반 강사 배정 관리"""

    def __init__(self, client: SupabaseClient):
        self._client = client

    async def list_assignments(self, filters: dict | None = None) -> list[dict]:
        query = self._client.table("assignments").select("*")
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        result = query.execute()
        return result.data

    async def create_assignment(self, data: dict) -> dict:
        try:
            result = self._client.table("assignments").insert(data).execute()
            return result.data[0]
        except Exception as e:
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                raise DuplicateAssignmentError(
                    f"강사 {data['instructor_id']}는 {data['date']}에 이미 배정됨"
                ) from e
            raise

    async def delete_assignment(self, assignment_id: str) -> bool:
        result = (
            self._client.table("assignments")
            .delete()
            .eq("id", assignment_id)
            .execute()
        )
        return len(result.data) > 0
