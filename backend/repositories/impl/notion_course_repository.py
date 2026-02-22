from repositories.course_repository import CourseRepository
from clients.notion_client import NotionClient


class NotionCourseRepository(CourseRepository):
    """Notion API에서 교육 목록/상세 조회 (동기화 소스)"""

    def __init__(self, client: NotionClient, database_id: str):
        self._client = client
        self._database_id = database_id

    async def list_courses(self, filters: dict | None = None) -> list[dict]:
        raise NotImplementedError("task 40에서 구현")

    async def get_course(self, course_id: str) -> dict | None:
        raise NotImplementedError("task 40에서 구현")
