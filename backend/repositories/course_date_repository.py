from abc import ABC, abstractmethod


class CourseDateRepository(ABC):
    """교육 날짜 관리 인터페이스"""

    @abstractmethod
    async def list_dates_by_course(self, course_id: str) -> list[dict]:
        ...

    @abstractmethod
    async def create_dates(self, course_id: str, dates: list[dict]) -> list[dict]:
        ...

    @abstractmethod
    async def delete_date(self, date_id: str) -> bool:
        ...
