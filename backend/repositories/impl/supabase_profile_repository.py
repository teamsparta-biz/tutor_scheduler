from clients.supabase_client import SupabaseClient
from repositories.profile_repository import ProfileRepository


class SupabaseProfileRepository(ProfileRepository):
    def __init__(self, client: SupabaseClient):
        self._client = client

    async def get_by_user_id(self, user_id: str) -> dict | None:
        result = (
            self._client.table("profiles")
            .select("*")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        return result.data if result else None

    async def create(self, data: dict) -> dict:
        result = (
            self._client.table("profiles")
            .insert(data)
            .execute()
        )
        return result.data[0]

    async def find_instructor_by_email(self, email: str) -> dict | None:
        result = (
            self._client.table("instructors")
            .select("*")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        return result.data if result else None
