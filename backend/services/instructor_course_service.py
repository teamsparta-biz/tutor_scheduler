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

        # 2. course_date_id → assignment 매핑 + course_date 정보 수집
        cd_ids = list({a["course_date_id"] for a in all_assignments})

        # course_date_id → course_id 역매핑을 위해 전체 course 조회
        all_courses = await self._course_repo.list_courses()
        course_map = {c["id"]: c for c in all_courses}

        # course_date별 정보 수집
        course_id_set: set[str] = set()
        cd_to_course: dict[str, str] = {}
        cd_info: dict[str, dict] = {}

        for course in all_courses:
            dates = await self._course_date_repo.list_dates_by_course(course["id"])
            for d in dates:
                if d["id"] in cd_ids:
                    cd_to_course[d["id"]] = course["id"]
                    cd_info[d["id"]] = d
                    course_id_set.add(course["id"])

        # 3. 고유 course별 데이터 조합
        course_items: list[dict] = []
        for course_id in course_id_set:
            course = course_map.get(course_id)
            if not course:
                continue

            # 이 course에서 강사가 배정된 assignment만 필터
            course_assignments = [
                a for a in all_assignments if cd_to_course.get(a["course_date_id"]) == course_id
            ]

            # 강사의 전체 role 결정 (가장 많이 배정된 class_name 기준)
            role = _determine_role(course_assignments)

            # 배정된 날짜 정보
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

            # 전체 course dates 수
            all_dates = await self._course_date_repo.list_dates_by_course(course_id)

            course_items.append({
                "course_id": course_id,
                "title": course.get("title", ""),
                "notion_page_id": course.get("notion_page_id", ""),
                "workbook_full_url": course.get("workbook_full_url"),
                "status": course.get("status"),
                "students": course.get("students"),
                "lecture_start": course.get("lecture_start"),
                "lecture_end": course.get("lecture_end"),
                "total_dates": len(all_dates),
                "role": role,
                "dates": dates_list,
            })

        # lecture_start 기준 정렬 (최신순)
        course_items.sort(
            key=lambda x: str(x.get("lecture_start") or ""),
            reverse=True,
        )

        # 4. 페이지네이션
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
    # class_name 빈도 계산
    counts: dict[str, int] = {}
    for a in assignments:
        cn = a.get("class_name", "")
        counts[cn] = counts.get(cn, 0) + 1
    most_common = max(counts, key=lambda k: counts[k])
    return CLASS_NAME_TO_ROLE.get(most_common, most_common or "강사")
