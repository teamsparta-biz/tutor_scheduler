from repositories.course_repository import CourseRepository


class CourseService:
    def __init__(self, repository: CourseRepository):
        self._repo = repository
