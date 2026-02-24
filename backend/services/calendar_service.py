from repositories.assignment_repository import AssignmentRepository
from repositories.course_repository import CourseRepository
from repositories.course_date_repository import CourseDateRepository
from repositories.instructor_repository import InstructorRepository


class CalendarService:
    def __init__(
        self,
        assignment_repo: AssignmentRepository,
        course_date_repo: CourseDateRepository,
        course_repo: CourseRepository,
        instructor_repo: InstructorRepository,
    ):
        self._assignment_repo = assignment_repo
        self._course_date_repo = course_date_repo
        self._course_repo = course_repo
        self._instructor_repo = instructor_repo

    async def get_calendar(self, start_date: str, end_date: str) -> dict:
        # DB 레벨 필터링: 날짜 범위의 배정만 조회
        filtered = await self._assignment_repo.list_assignments_by_date_range(
            start_date, end_date,
        )
        if not filtered:
            return {"events": []}

        # 필요한 instructor_id만 추출하여 전체 강사 목록에서 매핑
        instructors = await self._instructor_repo.list_instructors()
        instructor_map = {i["id"]: i for i in instructors}

        courses = await self._course_repo.list_courses()
        course_map = {c["id"]: c for c in courses}

        # 전체 course_dates를 한 번에 조회 (N+1 제거)
        all_dates = await self._course_date_repo.list_all_dates()
        cd_to_course = {cd["id"]: cd["course_id"] for cd in all_dates}

        events = []
        for a in filtered:
            instructor = instructor_map.get(a["instructor_id"], {})
            cd_id = a.get("course_date_id", "")
            course_id = cd_to_course.get(cd_id, "")
            course = course_map.get(course_id, {})

            events.append({
                "date": a["date"],
                "instructor_id": a["instructor_id"],
                "instructor_name": instructor.get("name", ""),
                "course_id": course_id,
                "course_title": course.get("title", ""),
                "course_status": course.get("status"),
                "assignment_status": course.get("assignment_status"),
                "class_name": a.get("class_name"),
                "assignment_id": a["id"],
                "notion_page_id": course.get("notion_page_id", ""),
                "workbook_full_url": course.get("workbook_full_url"),
            })

        return {"events": events}
