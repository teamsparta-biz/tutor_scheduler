from abc import ABC, abstractmethod


class ProfileRepository(ABC):
    """사용자 프로필 관리 인터페이스"""

    @abstractmethod
    async def get_by_user_id(self, user_id: str) -> dict | None:
        ...

    @abstractmethod
    async def create(self, data: dict) -> dict:
        ...

    @abstractmethod
    async def find_instructor_by_email(self, email: str) -> dict | None:
        ...

    @abstractmethod
    async def find_instructor_by_auth_email(self, email: str) -> dict | None:
        ...

    @abstractmethod
    async def update_instructor_auth_email(
        self, instructor_id: str, auth_email: str
    ) -> None:
        ...
