"""Notion 3개 DB → 로컬 DB 동기화 서비스.

Notion이 유일한 외부 의존성. 나중에 Notion을 제거할 때는
이 서비스와 NotionClient만 삭제하면 됨.
"""

from clients.notion_client import NotionClient
from config import Settings
from repositories.instructor_repository import InstructorRepository
from repositories.course_repository import CourseRepository
from repositories.course_date_repository import CourseDateRepository
from repositories.assignment_repository import AssignmentRepository


class NotionSyncService:
    def __init__(
        self,
        client: NotionClient,
        instructor_repo: InstructorRepository,
        course_repo: CourseRepository,
        course_date_repo: CourseDateRepository,
        assignment_repo: AssignmentRepository,
        settings: Settings,
    ):
        self._client = client
        self._instructor_repo = instructor_repo
        self._course_repo = course_repo
        self._course_date_repo = course_date_repo
        self._assignment_repo = assignment_repo
        self._settings = settings
        # notion page_id → local id 매핑
        self._tutor_map: dict[str, str] = {}
        self._course_map: dict[str, str] = {}

    async def sync_all(self) -> dict:
        """전체 동기화: 튜터 → 강의 → 일정(+배정) 순서."""
        tutor_count = await self._sync_tutors()
        course_count = await self._sync_courses()
        schedule_count, assignment_count = await self._sync_schedules()
        await self._compute_assignment_status()

        result = {
            "tutors": tutor_count,
            "courses": course_count,
            "schedules": schedule_count,
            "assignments": assignment_count,
        }
        print(f"[sync] {result}")
        return result

    # ── 튜터 동기화 ──

    async def _sync_tutors(self) -> int:
        pages = await self._client.query_database(self._settings.NOTION_DB_TUTOR)
        count = 0
        for page in pages:
            parsed = _parse_tutor(page)
            if not parsed["name"]:
                continue
            instructor = await self._instructor_repo.upsert_instructor(parsed)
            self._tutor_map[parsed["notion_page_id"]] = instructor["id"]
            count += 1
        print(f"[sync] tutors: {count}")
        return count

    # ── 강의 동기화 ──

    # 동기화 완료로 간주하는 상태 (더 이상 변하지 않는 교육)
    _FINISHED_STATES = {"tax_invoice", "lecture_stop"}

    async def _sync_courses(self) -> int:
        # 기존 DB 과목을 course_map에 미리 로드 (일정 매핑용)
        existing = await self._course_repo.list_courses()
        for c in existing:
            if c.get("notion_page_id"):
                self._course_map[c["notion_page_id"]] = c["id"]

        # 완료되지 않은 교육만 Notion에서 가져오기
        notion_filter = {
            "and": [
                {"property": "lecture_state", "status": {"does_not_equal": "tax_invoice"}},
                {"property": "lecture_state", "status": {"does_not_equal": "lecture_stop"}},
            ]
        }
        pages = await self._client.query_database(
            self._settings.NOTION_DB_LECTURE, filters=notion_filter,
        )
        count = 0
        for page in pages:
            parsed = _parse_lecture(page)
            if not parsed["title"]:
                continue
            parsed.pop("schedule_ids", None)
            course = await self._course_repo.upsert_course(parsed)
            self._course_map[parsed["notion_page_id"]] = course["id"]
            count += 1
        print(f"[sync] courses: {count} (active only, {len(existing)} total in DB)")
        return count

    # ── 일정 동기화 (+배정 자동 생성) ──

    async def _sync_schedules(self) -> tuple[int, int]:
        pages = await self._client.query_database(self._settings.NOTION_DB_SCHEDULE)
        schedule_count = 0
        assignment_count = 0

        for page in pages:
            parsed = _parse_schedule(page)
            if not parsed["date"]:
                continue

            # 역참조로 lecture_dashboard → course_id 매핑
            lecture_notion_ids = parsed.get("lecture_dashboard_ids", [])
            course_id = None
            for lid in lecture_notion_ids:
                course_id = self._course_map.get(lid)
                if course_id:
                    break
            if not course_id:
                continue

            # course_date 생성 (중복 시 무시)
            date_entry: dict = {"date": parsed["date"], "day_number": parsed.get("day_number", 1)}
            if parsed.get("place"):
                date_entry["place"] = parsed["place"]
            if parsed.get("start_time") is not None:
                date_entry["start_time"] = parsed["start_time"]
            if parsed.get("end_time") is not None:
                date_entry["end_time"] = parsed["end_time"]
            try:
                dates = await self._course_date_repo.create_dates(
                    course_id,
                    [date_entry],
                )
            except Exception:
                continue  # unique 제약 등 → 스킵
            if not dates:
                continue

            course_date = dates[0]
            schedule_count += 1

            # main_tutor가 있으면 배정
            for tutor_notion_id in parsed.get("main_tutor_ids", []):
                instructor_id = self._tutor_map.get(tutor_notion_id)
                if not instructor_id:
                    continue
                try:
                    await self._assignment_repo.create_assignment({
                        "course_date_id": course_date["id"],
                        "instructor_id": instructor_id,
                        "date": parsed["date"],
                        "class_name": "A반",
                    })
                    assignment_count += 1
                except Exception:
                    pass  # 중복 등 무시

            # tech_tutor도 배정
            for tutor_notion_id in parsed.get("tech_tutor_ids", []):
                instructor_id = self._tutor_map.get(tutor_notion_id)
                if not instructor_id:
                    continue
                try:
                    await self._assignment_repo.create_assignment({
                        "course_date_id": course_date["id"],
                        "instructor_id": instructor_id,
                        "date": parsed["date"],
                        "class_name": "기술지원",
                    })
                    assignment_count += 1
                except Exception:
                    pass

        print(f"[sync] schedules: {schedule_count}, assignments: {assignment_count}")
        return schedule_count, assignment_count

    # ── 배정 상태 계산 ──

    async def _compute_assignment_status(self):
        """각 course의 전체 일정 수 vs 배정된 일정 수 계산 → course에 저장."""
        courses = await self._course_repo.list_courses()
        all_assignments = await self._assignment_repo.list_assignments()

        for course in courses:
            cid = course["id"]
            dates = await self._course_date_repo.list_dates_by_course(cid)
            total = len(dates)

            cd_ids = {d["id"] for d in dates}
            assigned_cd_ids = {
                a["course_date_id"] for a in all_assignments
                if a["course_date_id"] in cd_ids
            }
            assigned = len(assigned_cd_ids)

            if total == 0:
                status = None
            elif assigned >= total:
                status = "배정 완료"
            else:
                status = "배정 미완료"

            await self._course_repo.update_course(cid, {
                "assignment_status": status,
                "total_dates": total,
                "assigned_dates": assigned,
            })


# ── Notion 페이지 파서 함수들 ──


def _extract_title(props: dict, *keys: str) -> str:
    for key in keys:
        prop = props.get(key)
        if prop and prop.get("type") == "title" and prop.get("title"):
            return "".join(t.get("plain_text", "") for t in prop["title"])
    return ""


def _extract_rich_text(props: dict, *keys: str) -> str:
    for key in keys:
        prop = props.get(key)
        if prop and prop.get("type") == "rich_text" and prop.get("rich_text"):
            return "".join(t.get("plain_text", "") for t in prop["rich_text"])
    return ""


def _extract_text(props: dict, *keys: str) -> str:
    result = _extract_title(props, *keys)
    if result:
        return result
    return _extract_rich_text(props, *keys)


def _extract_email(props: dict, key: str) -> str:
    prop = props.get(key)
    if prop and prop.get("type") == "email":
        return prop.get("email") or ""
    return ""


def _extract_phone(props: dict, key: str) -> str:
    prop = props.get(key)
    if prop and prop.get("type") == "phone_number":
        return prop.get("phone_number") or ""
    return ""


def _extract_select(props: dict, key: str) -> str:
    prop = props.get(key)
    if prop and prop.get("type") == "select" and prop.get("select"):
        return prop["select"].get("name", "")
    if prop and prop.get("type") == "status" and prop.get("status"):
        return prop["status"].get("name", "")
    return ""


def _extract_number(props: dict, key: str) -> int | float | None:
    prop = props.get(key)
    if prop and prop.get("type") == "number":
        return prop.get("number")
    return None


def _extract_date_start(props: dict, key: str) -> str:
    prop = props.get(key)
    if prop and prop.get("type") == "date" and prop.get("date"):
        return prop["date"].get("start") or ""
    return ""


def _extract_relation_ids(props: dict, key: str) -> list[str]:
    prop = props.get(key)
    if prop and prop.get("type") == "relation":
        return [r.get("id", "") for r in prop.get("relation", []) if r.get("id")]
    return []


def _extract_rollup_texts(props: dict, key: str) -> list[str]:
    prop = props.get(key)
    if not prop or prop.get("type") != "rollup":
        return []
    rollup = prop.get("rollup", {})
    arr = rollup.get("array", [])
    results = []
    for item in arr:
        if item.get("type") == "title":
            text = "".join(t.get("plain_text", "") for t in item.get("title", []))
            if text:
                results.append(text)
        elif item.get("type") == "rich_text":
            text = "".join(t.get("plain_text", "") for t in item.get("rich_text", []))
            if text:
                results.append(text)
    return results


def _parse_tutor(page: dict) -> dict:
    props = page.get("properties", {})
    name = _extract_rich_text(props, "real_name") or _extract_title(props, "unique_name")
    return {
        "notion_page_id": page["id"],
        "name": name,
        "email": _extract_email(props, "email") or None,
        "phone": _extract_phone(props, "phone_number") or None,
        "specialty": _extract_select(props, "tutor_level") or None,
        "is_active": True,
    }


def _extract_rollup_date(props: dict, key: str) -> str:
    prop = props.get(key)
    if not prop or prop.get("type") != "rollup":
        return ""
    rollup = prop.get("rollup", {})
    rollup_type = rollup.get("type", "")

    if rollup_type == "date" and rollup.get("date"):
        return rollup["date"].get("start") or ""

    if rollup_type == "array":
        for item in rollup.get("array", []):
            if item.get("type") == "date" and item.get("date"):
                return item["date"].get("start") or ""

    return ""


def _extract_rollup_url(props: dict, key: str) -> str:
    prop = props.get(key)
    if not prop or prop.get("type") != "rollup":
        return ""
    rollup = prop.get("rollup", {})
    for item in rollup.get("array", []):
        if item.get("type") == "url" and item.get("url"):
            return item["url"]
    return ""


def _parse_lecture(page: dict) -> dict:
    props = page.get("properties", {})

    title = _extract_title(props, "lecture_dashboard", "이름", "Name", "title")
    lecture_state = _extract_select(props, "lecture_state")
    lecture_start = _extract_rollup_date(props, "lecture_start")
    lecture_end = _extract_rollup_date(props, "lecture_end")
    students = _extract_number(props, "students")
    schedule_ids = _extract_relation_ids(props, "lecture_schedules")
    target_names = _extract_rollup_texts(props, "target_name")
    workbook_full_url = _extract_rollup_url(props, "workbook_full_URL")

    return {
        "notion_page_id": page["id"],
        "title": title,
        "status": lecture_state,
        "target": ", ".join(target_names) if target_names else None,
        "lecture_start": lecture_start or None,
        "lecture_end": lecture_end or None,
        "students": students,
        "workbook_full_url": workbook_full_url or None,
        "schedule_ids": schedule_ids,
    }


def _parse_schedule(page: dict) -> dict:
    props = page.get("properties", {})

    date = _extract_date_start(props, "date")
    place = _extract_rich_text(props, "place") or _extract_text(props, "place")
    main_tutor_ids = _extract_relation_ids(props, "main_tutor")
    tech_tutor_ids = _extract_relation_ids(props, "tech_tutor")
    lecture_dashboard_ids = _extract_relation_ids(props, "lecture_dashboard")
    name = _extract_title(props, "lecture_schedule_name")

    start_time = _extract_number(props, "start_time")
    end_time = _extract_number(props, "end_time")

    return {
        "notion_page_id": page["id"],
        "name": name,
        "date": date,
        "place": place,
        "start_time": start_time,
        "end_time": end_time,
        "main_tutor_ids": main_tutor_ids,
        "tech_tutor_ids": tech_tutor_ids,
        "lecture_dashboard_ids": lecture_dashboard_ids,
        "day_number": 1,
    }
