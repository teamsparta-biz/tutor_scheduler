from abc import ABC, abstractmethod


class InstructorRepository(ABC):
    """강사 관리 인터페이스"""

    @abstractmethod
    async def list_instructors(self, is_active: bool | None = None) -> list[dict]:
        ...

    @abstractmethod
    async def get_instructor(self, instructor_id: str) -> dict | None:
        ...

    @abstractmethod
    async def create_instructor(self, data: dict) -> dict:
        ...

    @abstractmethod
    async def update_instructor(self, instructor_id: str, data: dict) -> dict:
        ...

    @abstractmethod
    async def delete_instructor(self, instructor_id: str) -> bool:
        ...

    @abstractmethod
    async def upsert_instructor(self, data: dict) -> dict:
        ...
