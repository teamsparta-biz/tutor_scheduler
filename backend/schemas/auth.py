from pydantic import BaseModel


class UserProfile(BaseModel):
    id: str
    user_id: str
    email: str
    role: str
    display_name: str | None = None
    instructor_id: str | None = None


class AuthMeResponse(BaseModel):
    user_id: str
    email: str
    role: str
    display_name: str | None = None
    instructor_id: str | None = None
