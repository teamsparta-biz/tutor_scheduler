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

        # title (lecture_dashboard가 title 타입)
        title = ""
        for key in ("lecture_dashboard", "이름", "Name", "title"):
            prop = props.get(key)
            if prop and prop.get("type") == "title" and prop.get("title"):
                title = "".join(t.get("plain_text", "") for t in prop["title"])
                break

        # status (lecture_state: select 또는 status 타입)
        status = ""
        status_prop = props.get("lecture_state") or props.get("상태") or props.get("Status")
        if status_prop:
            if status_prop.get("type") == "select" and status_prop.get("select"):
                status = status_prop["select"].get("name", "")
            elif status_prop.get("type") == "status" and status_prop.get("status"):
                status = status_prop["status"].get("name", "")

        # target (target_name: rollup 타입)
        target = None
        target_prop = props.get("target_name")
        if target_prop and target_prop.get("type") == "rollup":
            texts = []
            for item in target_prop.get("rollup", {}).get("array", []):
                if item.get("type") == "title":
                    texts.append("".join(t.get("plain_text", "") for t in item.get("title", [])))
                elif item.get("type") == "rich_text":
                    texts.append("".join(t.get("plain_text", "") for t in item.get("rich_text", [])))
            target = ", ".join(t for t in texts if t) or None

        # students (number 타입)
        students = None
        students_prop = props.get("students")
        if students_prop and students_prop.get("type") == "number":
            students = students_prop.get("number")

        # lecture_start / lecture_end (rollup → date)
        def _rollup_date(key: str) -> str | None:
            prop = props.get(key)
            if not prop or prop.get("type") != "rollup":
                return None
            rollup = prop.get("rollup", {})
            if rollup.get("type") == "date" and rollup.get("date"):
                return rollup["date"].get("start") or None
            if rollup.get("type") == "array":
                for item in rollup.get("array", []):
                    if item.get("type") == "date" and item.get("date"):
                        return item["date"].get("start") or None
            return None

        lecture_start = _rollup_date("lecture_start")
        lecture_end = _rollup_date("lecture_end")

        # workbook_full_url (rollup → url)
        workbook_full_url = None
        wb_prop = props.get("workbook_full_URL")
        if wb_prop and wb_prop.get("type") == "rollup":
            for item in wb_prop.get("rollup", {}).get("array", []):
                if item.get("type") == "url" and item.get("url"):
                    workbook_full_url = item["url"]
                    break

        return {
            "notion_page_id": page["id"],
            "title": title,
            "status": status,
            "target": target,
            "students": students,
            "lecture_start": lecture_start,
            "lecture_end": lecture_end,
            "workbook_full_url": workbook_full_url,
        }
