from abc import ABC, abstractmethod


class NotionClient(ABC):
    """Notion API 호출 인터페이스"""

    @abstractmethod
    async def query_database(self, database_id: str, filters: dict | None = None) -> list[dict]:
        """Notion DB 쿼리"""
        ...

    @abstractmethod
    async def get_page(self, page_id: str) -> dict:
        """Notion 페이지 속성 조회"""
        ...
