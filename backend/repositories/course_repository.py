from abc import ABC, abstractmethod


class CourseRepository(ABC):
    """교육 과정 조회 인터페이스"""

    @abstractmethod
    async def list_courses(self, filters: dict | None = None) -> list[dict]:
        """교육 목록 조회"""
        ...

    @abstractmethod
    async def get_course(self, course_id: str) -> dict | None:
        """교육 상세 조회"""
        ...
