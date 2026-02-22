from datetime import date

from pydantic import BaseModel


class AssignmentBase(BaseModel):
    course_date_id: str
    instructor_id: str
    date: date
    class_name: str | None = None
