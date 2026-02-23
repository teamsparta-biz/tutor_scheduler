def test_calendar_empty(client):
    resp = client.get("/api/calendar?start_date=2026-03-01&end_date=2026-03-31")
    assert resp.status_code == 200
    assert resp.json()["events"] == []


def test_calendar_with_assignments(client):
    # 강사 생성
    instr = client.post("/api/instructors", json={"name": "김강사"}).json()

    # 배정 생성
    client.post("/api/assignments", json={
        "course_date_id": "cd-1",
        "instructor_id": instr["id"],
        "date": "2026-03-15",
    })

    resp = client.get("/api/calendar?start_date=2026-03-01&end_date=2026-03-31")
    assert resp.status_code == 200
    events = resp.json()["events"]
    assert len(events) == 1
    assert events[0]["instructor_id"] == instr["id"]
    assert events[0]["instructor_name"] == "김강사"
    assert events[0]["date"] == "2026-03-15"


def test_calendar_date_filter(client):
    instr = client.post("/api/instructors", json={"name": "이강사"}).json()

    client.post("/api/assignments", json={
        "course_date_id": "cd-1",
        "instructor_id": instr["id"],
        "date": "2026-03-15",
    })

    # 범위 밖 조회
    resp = client.get("/api/calendar?start_date=2026-04-01&end_date=2026-04-30")
    assert resp.status_code == 200
    assert resp.json()["events"] == []
