import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import create_app
from dependencies import (
    get_instructor_repository,
    get_course_repository,
    get_course_date_repository,
    get_assignment_repository,
    get_availability_repository,
    get_current_user,
)
from schemas.auth import UserProfile
from tests.fakes.fake_instructor_repository import FakeInstructorRepository
from tests.fakes.fake_course_repository import FakeCourseRepository
from tests.fakes.fake_course_date_repository import FakeCourseDateRepository
from tests.fakes.fake_assignment_repository import FakeAssignmentRepository
from tests.fakes.fake_availability_repository import FakeAvailabilityRepository


_fake_admin = UserProfile(
    id="test-profile-id",
    user_id="test-user-id",
    email="admin@teamsparta.co",
    role="admin",
    display_name="테스트 관리자",
    instructor_id=None,
)


@pytest.fixture
def app():
    app = create_app()
    fake_instructor_repo = FakeInstructorRepository()
    fake_course_repo = FakeCourseRepository()
    fake_course_date_repo = FakeCourseDateRepository()
    fake_assignment_repo = FakeAssignmentRepository()
    fake_availability_repo = FakeAvailabilityRepository()
    app.dependency_overrides[get_instructor_repository] = lambda: fake_instructor_repo
    app.dependency_overrides[get_course_repository] = lambda: fake_course_repo
    app.dependency_overrides[get_course_date_repository] = lambda: fake_course_date_repo
    app.dependency_overrides[get_assignment_repository] = lambda: fake_assignment_repo
    app.dependency_overrides[get_availability_repository] = lambda: fake_availability_repo
    app.dependency_overrides[get_current_user] = lambda: _fake_admin
    return app


@pytest.fixture
def client(app):
    return TestClient(app)
