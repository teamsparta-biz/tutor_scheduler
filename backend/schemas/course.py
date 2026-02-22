from pydantic import BaseModel


class CourseBase(BaseModel):
    notion_page_id: str
    title: str
    status: str | None = None
    target: str | None = None
