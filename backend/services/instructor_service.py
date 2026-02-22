from repositories.instructor_repository import InstructorRepository


class InstructorService:
    def __init__(self, repository: InstructorRepository):
        self._repo = repository
