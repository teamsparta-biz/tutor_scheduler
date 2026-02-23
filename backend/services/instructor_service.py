from fastapi import HTTPException

from repositories.instructor_repository import InstructorRepository
from schemas.instructor import InstructorCreate, InstructorUpdate


class InstructorService:
    def __init__(self, repository: InstructorRepository):
        self._repo = repository

    async def list_instructors(self, is_active: bool | None = None) -> list[dict]:
        return await self._repo.list_instructors(is_active=is_active)

    async def get_instructor(self, instructor_id: str) -> dict:
        instructor = await self._repo.get_instructor(instructor_id)
        if not instructor:
            raise HTTPException(status_code=404, detail="강사를 찾을 수 없습니다")
        return instructor

    async def create_instructor(self, data: InstructorCreate) -> dict:
        return await self._repo.create_instructor(data.model_dump())

    async def update_instructor(self, instructor_id: str, data: InstructorUpdate) -> dict:
        await self.get_instructor(instructor_id)
        update_data = data.model_dump(exclude_unset=True)
        return await self._repo.update_instructor(instructor_id, update_data)

    async def delete_instructor(self, instructor_id: str) -> bool:
        await self.get_instructor(instructor_id)
        return await self._repo.delete_instructor(instructor_id)
