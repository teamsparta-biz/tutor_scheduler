from repositories.course_repository import CourseRepository


class CourseSyncService:
    def __init__(
        self,
        notion_repo: CourseRepository,
        local_repo: CourseRepository,
    ):
        self._notion_repo = notion_repo
        self._local_repo = local_repo
