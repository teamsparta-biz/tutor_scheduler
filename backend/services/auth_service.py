from exceptions import AuthorizationError
from repositories.profile_repository import ProfileRepository
from schemas.auth import UserProfile


class AuthService:
    def __init__(self, profile_repo: ProfileRepository):
        self._profile_repo = profile_repo

    async def get_or_create_profile(self, user_id: str, email: str) -> UserProfile:
        """프로필 조회 또는 생성 + 화이트리스트 검증"""
        profile = await self._profile_repo.get_by_user_id(user_id)

        if not profile:
            # DB 트리거가 생성하지 못한 경우 직접 생성
            role = "admin" if email.endswith("@teamsparta.co") else "instructor"
            display_name = email.split("@")[0]
            profile = await self._profile_repo.create({
                "user_id": user_id,
                "role": role,
                "display_name": display_name,
            })

        role = profile["role"]
        instructor_id = None

        if role == "instructor":
            # 1) auth_email로 검색
            instructor = await self._profile_repo.find_instructor_by_auth_email(email)
            if not instructor:
                # 2) email(연락처)로 검색 → 매칭되면 auth_email 자동 저장
                instructor = await self._profile_repo.find_instructor_by_email(email)
                if instructor:
                    await self._profile_repo.update_instructor_auth_email(
                        instructor["id"], email
                    )
            if not instructor:
                raise AuthorizationError(
                    "접근 권한이 없습니다. instructors 테이블에 등록된 이메일만 사용할 수 있습니다."
                )
            instructor_id = instructor["id"]

        return UserProfile(
            id=profile["id"],
            user_id=profile["user_id"],
            email=email,
            role=role,
            display_name=profile.get("display_name"),
            instructor_id=instructor_id,
        )
