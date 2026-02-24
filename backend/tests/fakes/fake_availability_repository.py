from uuid import uuid4

from repositories.availability_repository import AvailabilityRepository


class FakeAvailabilityRepository(AvailabilityRepository):
    def __init__(self):
        self._store: dict[str, dict] = {}

    async def list_by_instructor(self, instructor_id: str) -> list[dict]:
        return [
            a for a in self._store.values()
            if a["instructor_id"] == instructor_id
        ]

    async def list_by_instructor_and_date_range(
        self, instructor_id: str, start_date: str, end_date: str,
    ) -> list[dict]:
        return [
            a for a in self._store.values()
            if a["instructor_id"] == instructor_id
            and start_date <= str(a["date"]) <= end_date
        ]

    async def list_by_date_range(self, start_date: str, end_date: str) -> list[dict]:
        return [
            a for a in self._store.values()
            if start_date <= str(a["date"]) <= end_date
        ]

    async def create(self, data: dict) -> dict:
        item = {"id": str(uuid4()), **data}
        self._store[item["id"]] = item
        return item

    async def upsert(self, data: dict) -> dict:
        for item in self._store.values():
            if item["instructor_id"] == data["instructor_id"] and str(item["date"]) == str(data["date"]):
                item.update(data)
                return item
        return await self.create(data)

    async def update(self, availability_id: str, data: dict) -> dict | None:
        item = self._store.get(availability_id)
        if not item:
            return None
        item.update(data)
        return item

    async def delete(self, availability_id: str) -> bool:
        return self._store.pop(availability_id, None) is not None
