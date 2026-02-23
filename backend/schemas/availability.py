from datetime import date
from typing import Literal

from pydantic import BaseModel

AvailabilityStatus = Literal["available", "unavailable"]


class AvailabilityCreate(BaseModel):
    instructor_id: str
    date: date
    status: AvailabilityStatus = "unavailable"
    reason: str | None = None


class AvailabilityResponse(BaseModel):
    id: str
    instructor_id: str
    date: date
    status: AvailabilityStatus = "unavailable"
    reason: str | None = None

    model_config = {"from_attributes": True}
