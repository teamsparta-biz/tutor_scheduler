from datetime import timedelta

from fastapi import HTTPException

from repositories.course_repository import CourseRepository
from repositories.course_date_repository import CourseDateRepository
from schemas.course import CourseCreate, CourseUpdate


class CourseService:
    def __init__(
        self,
        repository: CourseRepository,
        date_repository: CourseDateRepository,
    ):
        self._repo = repository
        self._date_repo = date_repository

    async def list_courses(self) -> list[dict]:
        return await self._repo.list_courses()

    async def get_course(self, course_id: str) -> dict:
        course = await self._repo.get_course(course_id)
        if not course:
            raise HTTPException(status_code=404, detail="교육을 찾을 수 없습니다")
        return course

    async def get_course_detail(self, course_id: str) -> dict:
        course = await self.get_course(course_id)
        dates = await self._date_repo.list_dates_by_course(course_id)
        return {**course, "dates": dates}

    async def create_course(self, data: CourseCreate) -> dict:
        course_data = data.model_dump(exclude={"start_date", "end_date"})
        course = await self._repo.create_course(course_data)
        dates = self._generate_dates(data.start_date, data.end_date)
        await self._date_repo.create_dates(course["id"], dates)
        return course

    async def update_course(self, course_id: str, data: CourseUpdate) -> dict:
        await self.get_course(course_id)
        update_data = data.model_dump(exclude_unset=True)
        return await self._repo.update_course(course_id, update_data)

    async def delete_course(self, course_id: str) -> bool:
        await self.get_course(course_id)
        return await self._repo.delete_course(course_id)

    @staticmethod
    def _generate_dates(start_date, end_date) -> list[dict]:
        dates = []
        current = start_date
        day_number = 1
        while current <= end_date:
            dates.append({
                "date": str(current),
                "day_number": day_number,
            })
            current += timedelta(days=1)
            day_number += 1
        return dates
