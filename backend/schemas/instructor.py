from pydantic import BaseModel


class InstructorBase(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    specialty: str | None = None
    is_active: bool = True
