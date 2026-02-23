from clients.notion_client import NotionClient
from repositories.course_repository import CourseRepository


class NotionCourseRepository(CourseRepository):
    """Notion API에서 교육 목록/상세 조회 (동기화 소스)"""

    def __init__(self, client: NotionClient, database_id: str):
        self._client = client
        self._database_id = database_id

    async def list_courses(self, filters: dict | None = None) -> list[dict]:
        pages = await self._client.query_database(self._database_id, filters)
        return [self._parse_page(p) for p in pages]

    async def get_course(self, course_id: str) -> dict | None:
        page = await self._client.get_page(course_id)
        return self._parse_page(page) if page else None

    async def create_course(self, data: dict) -> dict:
        raise NotImplementedError("Notion은 읽기 전용 소스입니다")

    async def update_course(self, course_id: str, data: dict) -> dict:
        raise NotImplementedError("Notion은 읽기 전용 소스입니다")

    async def delete_course(self, course_id: str) -> bool:
        raise NotImplementedError("Notion은 읽기 전용 소스입니다")

    async def upsert_course(self, data: dict) -> dict:
        raise NotImplementedError("Notion은 읽기 전용 소스입니다")

    @staticmethod
    def _parse_page(page: dict) -> dict:
        props = page.get("properties", {})

        title = ""
        title_prop = props.get("이름") or props.get("Name") or props.get("title")
        if title_prop and title_prop.get("title"):
            title = "".join(
                t.get("plain_text", "") for t in title_prop["title"]
            )

        status = ""
        status_prop = props.get("상태") or props.get("Status")
        if status_prop and status_prop.get("status"):
            status = status_prop["status"].get("name", "")

        target = ""
        target_prop = props.get("교육대상") or props.get("Target")
        if target_prop:
            if target_prop.get("rich_text"):
                target = "".join(
                    t.get("plain_text", "") for t in target_prop["rich_text"]
                )
            elif target_prop.get("select"):
                target = target_prop["select"].get("name", "")

        return {
            "notion_page_id": page["id"],
            "title": title,
            "status": status,
            "target": target,
        }
