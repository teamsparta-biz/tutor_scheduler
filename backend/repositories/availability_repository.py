from abc import ABC, abstractmethod


class AvailabilityRepository(ABC):
    """강사 불가일 관리 인터페이스"""

    @abstractmethod
    async def list_by_instructor(self, instructor_id: str) -> list[dict]:
        ...

    @abstractmethod
    async def list_by_date_range(self, start_date: str, end_date: str) -> list[dict]:
        ...

    @abstractmethod
    async def create(self, data: dict) -> dict:
        ...

    @abstractmethod
    async def update(self, availability_id: str, data: dict) -> dict | None:
        ...

    @abstractmethod
    async def delete(self, availability_id: str) -> bool:
        ...
