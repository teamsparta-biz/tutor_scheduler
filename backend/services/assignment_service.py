from repositories.assignment_repository import AssignmentRepository


class AssignmentService:
    def __init__(self, repository: AssignmentRepository):
        self._repo = repository
