from abc import ABC, abstractmethod


class AssignmentRepository(ABC):
    """강사 배정 인터페이스"""

    @abstractmethod
    async def list_assignments(self, filters: dict | None = None) -> list[dict]:
        ...

    @abstractmethod
    async def create_assignment(self, data: dict) -> dict:
        """배정 생성. UNIQUE 위반 시 예외 발생."""
        ...

    @abstractmethod
    async def delete_assignment(self, assignment_id: str) -> bool:
        ...
