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
)
from tests.fakes.fake_instructor_repository import FakeInstructorRepository
from tests.fakes.fake_course_repository import FakeCourseRepository
from tests.fakes.fake_course_date_repository import FakeCourseDateRepository
from tests.fakes.fake_assignment_repository import FakeAssignmentRepository


@pytest.fixture
def app():
    app = create_app()
    fake_instructor_repo = FakeInstructorRepository()
    fake_course_repo = FakeCourseRepository()
    fake_course_date_repo = FakeCourseDateRepository()
    fake_assignment_repo = FakeAssignmentRepository()
    app.dependency_overrides[get_instructor_repository] = lambda: fake_instructor_repo
    app.dependency_overrides[get_course_repository] = lambda: fake_course_repo
    app.dependency_overrides[get_course_date_repository] = lambda: fake_course_date_repo
    app.dependency_overrides[get_assignment_repository] = lambda: fake_assignment_repo
    return app


@pytest.fixture
def client(app):
    return TestClient(app)
