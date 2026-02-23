from datetime import date

from pydantic import BaseModel


class CalendarQuery(BaseModel):
    start_date: date
    end_date: date


class CalendarEvent(BaseModel):
    date: date
    instructor_id: str
    instructor_name: str
    course_id: str
    course_title: str
    course_status: str | None = None
    assignment_status: str | None = None
    class_name: str | None = None
    assignment_id: str


class CalendarResponse(BaseModel):
    events: list[CalendarEvent]
