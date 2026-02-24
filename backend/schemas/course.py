from datetime import date

from pydantic import BaseModel


class CourseBase(BaseModel):
    notion_page_id: str
    title: str
    status: str | None = None
    target: str | None = None
    students: int | None = None
    lecture_start: str | None = None
    lecture_end: str | None = None
    workbook_full_url: str | None = None
    manager: str | None = None
    sales_rep: str | None = None


class CourseCreate(CourseBase):
    start_date: date
    end_date: date


class CourseUpdate(BaseModel):
    title: str | None = None
    status: str | None = None
    target: str | None = None


class CourseResponse(CourseBase):
    id: str
    assignment_status: str | None = None
    total_dates: int | None = None
    assigned_dates: int | None = None

    model_config = {"from_attributes": True}


class CourseDateResponse(BaseModel):
    id: str
    course_id: str
    date: date
    day_number: int
    place: str | None = None
    start_time: float | None = None
    end_time: float | None = None

    model_config = {"from_attributes": True}


class CourseDetailResponse(CourseResponse):
    dates: list[CourseDateResponse] = []


class SyncResultResponse(BaseModel):
    synced: int
    errors: int


class FullSyncResultResponse(BaseModel):
    tutors: int
    courses: int
    schedules: int
    assignments: int


class CourseSyncResultResponse(BaseModel):
    courses: int
    schedules: int
    assignments: int
