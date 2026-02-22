from repositories.assignment_repository import AssignmentRepository
from repositories.course_date_repository import CourseDateRepository


class CalendarService:
    def __init__(
        self,
        assignment_repo: AssignmentRepository,
        course_date_repo: CourseDateRepository,
    ):
        self._assignment_repo = assignment_repo
        self._course_date_repo = course_date_repo
