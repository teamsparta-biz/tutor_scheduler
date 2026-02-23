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

    @abstractmethod
    async def create_course(self, data: dict) -> dict:
        """교육 생성"""
        ...

    @abstractmethod
    async def update_course(self, course_id: str, data: dict) -> dict:
        """교육 수정"""
        ...

    @abstractmethod
    async def delete_course(self, course_id: str) -> bool:
        """교육 삭제"""
        ...

    @abstractmethod
    async def upsert_course(self, data: dict) -> dict:
        """교육 upsert (notion_page_id 기준)"""
        ...
