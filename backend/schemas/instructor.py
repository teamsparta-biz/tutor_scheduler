from pydantic import BaseModel


class InstructorBase(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    specialty: str | None = None
    is_active: bool = True


class InstructorCreate(InstructorBase):
    pass


class InstructorUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    specialty: str | None = None
    is_active: bool | None = None


class InstructorResponse(InstructorBase):
    id: str

    model_config = {"from_attributes": True}
