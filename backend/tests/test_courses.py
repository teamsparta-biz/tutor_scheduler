def test_create_course(client):
    resp = client.post("/api/courses", json={
        "notion_page_id": "page-1",
        "title": "AI 교육",
        "status": "진행 중",
        "start_date": "2026-03-01",
        "end_date": "2026-03-03",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "AI 교육"
    assert "id" in data


def test_create_course_generates_dates(client):
    resp = client.post("/api/courses", json={
        "notion_page_id": "page-2",
        "title": "3일 교육",
        "start_date": "2026-03-10",
        "end_date": "2026-03-12",
    })
    course_id = resp.json()["id"]
    detail = client.get(f"/api/courses/{course_id}")
    assert detail.status_code == 200
    dates = detail.json()["dates"]
    assert len(dates) == 3
    assert dates[0]["day_number"] == 1
    assert dates[2]["day_number"] == 3


def test_list_courses(client):
    client.post("/api/courses", json={
        "notion_page_id": "p1", "title": "A", "start_date": "2026-01-01", "end_date": "2026-01-01",
    })
    client.post("/api/courses", json={
        "notion_page_id": "p2", "title": "B", "start_date": "2026-01-01", "end_date": "2026-01-01",
    })
    resp = client.get("/api/courses")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_course_not_found(client):
    resp = client.get("/api/courses/nonexistent")
    assert resp.status_code == 404


def test_update_course(client):
    create = client.post("/api/courses", json={
        "notion_page_id": "p3", "title": "원래제목",
        "start_date": "2026-01-01", "end_date": "2026-01-01",
    })
    course_id = create.json()["id"]
    resp = client.put(f"/api/courses/{course_id}", json={"title": "변경제목"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "변경제목"


def test_delete_course(client):
    create = client.post("/api/courses", json={
        "notion_page_id": "p4", "title": "삭제대상",
        "start_date": "2026-01-01", "end_date": "2026-01-01",
    })
    course_id = create.json()["id"]
    resp = client.delete(f"/api/courses/{course_id}")
    assert resp.status_code == 204
    assert client.get(f"/api/courses/{course_id}").status_code == 404


def test_single_day_course(client):
    resp = client.post("/api/courses", json={
        "notion_page_id": "p5", "title": "1일 교육",
        "start_date": "2026-05-01", "end_date": "2026-05-01",
    })
    course_id = resp.json()["id"]
    detail = client.get(f"/api/courses/{course_id}")
    assert len(detail.json()["dates"]) == 1
