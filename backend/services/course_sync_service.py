from repositories.course_repository import CourseRepository


class CourseSyncService:
    def __init__(
        self,
        notion_repo: CourseRepository,
        local_repo: CourseRepository,
    ):
        self._notion_repo = notion_repo
        self._local_repo = local_repo

    async def sync_courses(self) -> dict:
        notion_courses = await self._notion_repo.list_courses()
        synced = 0
        errors = 0
        for course_data in notion_courses:
            try:
                await self._local_repo.upsert_course(course_data)
                synced += 1
            except Exception:
                errors += 1
        return {"synced": synced, "errors": errors}
