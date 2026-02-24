from clients.supabase_client import SupabaseClient
from repositories.availability_repository import AvailabilityRepository


class SupabaseAvailabilityRepository(AvailabilityRepository):
    """Supabase 기반 강사 불가일 관리"""

    def __init__(self, client: SupabaseClient):
        self._client = client

    async def list_by_instructor(self, instructor_id: str) -> list[dict]:
        result = (
            self._client.table("availability")
            .select("*")
            .eq("instructor_id", instructor_id)
            .execute()
        )
        return result.data

    async def list_by_date_range(self, start_date: str, end_date: str) -> list[dict]:
        result = (
            self._client.table("availability")
            .select("*")
            .gte("date", start_date)
            .lte("date", end_date)
            .execute()
        )
        return result.data

    async def create(self, data: dict) -> dict:
        result = self._client.table("availability").insert(data).execute()
        return result.data[0]

    async def update(self, availability_id: str, data: dict) -> dict | None:
        result = (
            self._client.table("availability")
            .update(data)
            .eq("id", availability_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def delete(self, availability_id: str) -> bool:
        result = (
            self._client.table("availability")
            .delete()
            .eq("id", availability_id)
            .execute()
        )
        return len(result.data) > 0
