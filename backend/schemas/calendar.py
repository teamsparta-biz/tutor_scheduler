from datetime import date

from pydantic import BaseModel


class CalendarQuery(BaseModel):
    start_date: date
    end_date: date
