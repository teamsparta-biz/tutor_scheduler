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
        assignments = await self._assignment_repo.list_assignments()
        filtered = [
            a for a in assignments
            if start_date <= str(a["date"]) <= end_date
        ]

        if not filtered:
            return {"events": []}

        instructors = await self._instructor_repo.list_instructors()
        instructor_map = {i["id"]: i for i in instructors}

        courses = await self._course_repo.list_courses()
        course_map = {c["id"]: c for c in courses}

        # course_date_id → course_id 매핑 구축
        cd_to_course: dict[str, str] = {}
        for course in courses:
            dates = await self._course_date_repo.list_dates_by_course(course["id"])
            for cd in dates:
                cd_to_course[cd["id"]] = course["id"]

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
            })

        return {"events": events}
