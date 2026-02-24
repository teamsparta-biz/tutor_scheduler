"""강사별 배정 교육 조합 서비스."""

from repositories.assignment_repository import AssignmentRepository
from repositories.course_repository import CourseRepository
from repositories.course_date_repository import CourseDateRepository


CLASS_NAME_TO_ROLE = {
    "A반": "주강사",
    "B반": "주강사",
    "기술지원": "기술 튜터",
}


class InstructorCourseService:
    def __init__(
        self,
        assignment_repo: AssignmentRepository,
        course_repo: CourseRepository,
        course_date_repo: CourseDateRepository,
    ):
        self._assignment_repo = assignment_repo
        self._course_repo = course_repo
        self._course_date_repo = course_date_repo

    async def list_courses_for_instructor(
        self, instructor_id: str, page: int = 1, page_size: int = 10
    ) -> dict:
        """강사에게 배정된 교육 목록을 페이지네이션으로 반환."""
        # 1. 해당 강사의 전체 assignment 조회
        all_assignments = await self._assignment_repo.list_assignments(
            filters={"instructor_id": instructor_id}
        )
        if not all_assignments:
            return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}

        cd_ids = {a["course_date_id"] for a in all_assignments}

        # 2. 전체 course_dates를 한 번에 조회 (N+1 제거)
        all_dates = await self._course_date_repo.list_all_dates()
        cd_to_course: dict[str, str] = {}
        cd_info: dict[str, dict] = {}
        dates_by_course: dict[str, list[dict]] = {}
        for d in all_dates:
            dates_by_course.setdefault(d["course_id"], []).append(d)
            if d["id"] in cd_ids:
                cd_to_course[d["id"]] = d["course_id"]
                cd_info[d["id"]] = d

        course_id_set = set(cd_to_course.values())

        # 3. 필요한 course만 조회
        all_courses = await self._course_repo.list_courses()
        course_map = {c["id"]: c for c in all_courses}

        # 4. 고유 course별 데이터 조합
        course_items: list[dict] = []
        for course_id in course_id_set:
            course = course_map.get(course_id)
            if not course:
                continue

            course_assignments = [
                a for a in all_assignments if cd_to_course.get(a["course_date_id"]) == course_id
            ]
            role = _determine_role(course_assignments)

            dates_list = []
            for a in sorted(course_assignments, key=lambda x: str(x.get("date", ""))):
                cd = cd_info.get(a["course_date_id"], {})
                dates_list.append({
                    "date": str(a.get("date", cd.get("date", ""))),
                    "day_number": cd.get("day_number", 0),
                    "place": cd.get("place"),
                    "start_time": cd.get("start_time"),
                    "end_time": cd.get("end_time"),
                    "role": CLASS_NAME_TO_ROLE.get(a.get("class_name", ""), a.get("class_name", "강사")),
                })

            # 메모리에서 total_dates 계산 (2차 N+1 제거)
            total_dates = len(dates_by_course.get(course_id, []))

            course_items.append({
                "course_id": course_id,
                "title": course.get("title", ""),
                "notion_page_id": course.get("notion_page_id", ""),
                "workbook_full_url": course.get("workbook_full_url"),
                "status": course.get("status"),
                "students": course.get("students"),
                "lecture_start": course.get("lecture_start"),
                "lecture_end": course.get("lecture_end"),
                "total_dates": total_dates,
                "role": role,
                "dates": dates_list,
            })

        course_items.sort(
            key=lambda x: str(x.get("lecture_start") or ""),
            reverse=True,
        )

        # 5. 페이지네이션
        total = len(course_items)
        offset = (page - 1) * page_size
        items = course_items[offset: offset + page_size]
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }


def _determine_role(assignments: list[dict]) -> str:
    """배정 목록에서 대표 역할을 결정."""
    if not assignments:
        return "강사"
    counts: dict[str, int] = {}
    for a in assignments:
        cn = a.get("class_name", "")
        counts[cn] = counts.get(cn, 0) + 1
    most_common = max(counts, key=lambda k: counts[k])
    return CLASS_NAME_TO_ROLE.get(most_common, most_common or "강사")
