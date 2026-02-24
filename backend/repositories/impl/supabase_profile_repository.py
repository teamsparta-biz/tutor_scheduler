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

    async def find_instructor_by_auth_email(self, email: str) -> dict | None:
        result = (
            self._client.table("instructors")
            .select("*")
            .eq("auth_email", email)
            .maybe_single()
            .execute()
        )
        return result.data if result else None

    async def update_instructor_auth_email(
        self, instructor_id: str, auth_email: str
    ) -> None:
        self._client.table("instructors").update(
            {"auth_email": auth_email}
        ).eq("id", instructor_id).execute()
