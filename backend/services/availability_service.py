from fastapi import HTTPException

from repositories.availability_repository import AvailabilityRepository
from schemas.availability import AvailabilityCreate


class AvailabilityService:
    def __init__(self, repository: AvailabilityRepository):
        self._repo = repository

    async def list_by_instructor(self, instructor_id: str) -> list[dict]:
        return await self._repo.list_by_instructor(instructor_id)

    async def list_by_date_range(self, start_date: str, end_date: str) -> list[dict]:
        return await self._repo.list_by_date_range(start_date, end_date)

    async def create(self, data: AvailabilityCreate) -> dict:
        # 같은 날짜에 이미 레코드가 있으면 상태 업데이트 (upsert)
        existing = await self._repo.list_by_instructor(data.instructor_id)
        date_str = str(data.date)
        for item in existing:
            if str(item["date"]) == date_str:
                updated = await self._repo.update(item["id"], {
                    "status": data.status,
                    "reason": data.reason,
                })
                if updated:
                    return updated
        return await self._repo.create(data.model_dump(mode="json"))

    async def delete(self, availability_id: str) -> bool:
        result = await self._repo.delete(availability_id)
        if not result:
            raise HTTPException(status_code=404, detail="가용성 레코드를 찾을 수 없습니다")
        return result
