from uuid import uuid4

from repositories.profile_repository import ProfileRepository


class FakeProfileRepository(ProfileRepository):
    def __init__(self):
        self._profiles: dict[str, dict] = {}
        self._instructors: dict[str, dict] = {}

    def add_instructor(self, email: str, instructor_id: str | None = None):
        iid = instructor_id or str(uuid4())
        self._instructors[email] = {
            "id": iid,
            "email": email,
            "name": email.split("@")[0],
            "is_active": True,
        }

    async def get_by_user_id(self, user_id: str) -> dict | None:
        for p in self._profiles.values():
            if p["user_id"] == user_id:
                return p
        return None

    async def create(self, data: dict) -> dict:
        item = {"id": str(uuid4()), **data}
        self._profiles[item["id"]] = item
        return item

    async def find_instructor_by_email(self, email: str) -> dict | None:
        return self._instructors.get(email)
