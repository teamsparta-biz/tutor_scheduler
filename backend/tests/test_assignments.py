def _create_instructor(client, name="김강사"):
    resp = client.post("/api/instructors", json={"name": name})
    return resp.json()["id"]


def test_create_assignment(client):
    instructor_id = _create_instructor(client)
    resp = client.post("/api/assignments", json={
        "course_date_id": "cd-1",
        "instructor_id": instructor_id,
        "date": "2026-03-01",
        "class_name": "A반",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["instructor_id"] == instructor_id
    assert data["date"] == "2026-03-01"
    assert "id" in data


def test_duplicate_assignment_returns_400(client):
    instructor_id = _create_instructor(client)
    payload = {
        "course_date_id": "cd-1",
        "instructor_id": instructor_id,
        "date": "2026-03-01",
    }
    resp1 = client.post("/api/assignments", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/assignments", json=payload)
    assert resp2.status_code == 400
    assert "이미 배정" in resp2.json()["detail"]


def test_different_instructor_same_day_ok(client):
    id1 = _create_instructor(client, "강사A")
    id2 = _create_instructor(client, "강사B")
    resp1 = client.post("/api/assignments", json={
        "course_date_id": "cd-1", "instructor_id": id1, "date": "2026-03-01",
    })
    resp2 = client.post("/api/assignments", json={
        "course_date_id": "cd-2", "instructor_id": id2, "date": "2026-03-01",
    })
    assert resp1.status_code == 201
    assert resp2.status_code == 201


def test_same_instructor_different_day_ok(client):
    instructor_id = _create_instructor(client)
    resp1 = client.post("/api/assignments", json={
        "course_date_id": "cd-1", "instructor_id": instructor_id, "date": "2026-03-01",
    })
    resp2 = client.post("/api/assignments", json={
        "course_date_id": "cd-2", "instructor_id": instructor_id, "date": "2026-03-02",
    })
    assert resp1.status_code == 201
    assert resp2.status_code == 201


def test_list_assignments(client):
    instructor_id = _create_instructor(client)
    client.post("/api/assignments", json={
        "course_date_id": "cd-1", "instructor_id": instructor_id, "date": "2026-03-01",
    })
    resp = client.get("/api/assignments")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_delete_assignment(client):
    instructor_id = _create_instructor(client)
    create_resp = client.post("/api/assignments", json={
        "course_date_id": "cd-1", "instructor_id": instructor_id, "date": "2026-03-01",
    })
    assignment_id = create_resp.json()["id"]
    resp = client.delete(f"/api/assignments/{assignment_id}")
    assert resp.status_code == 204

    # 삭제 후 같은 날 다시 배정 가능
    resp2 = client.post("/api/assignments", json={
        "course_date_id": "cd-1", "instructor_id": instructor_id, "date": "2026-03-01",
    })
    assert resp2.status_code == 201


def test_available_instructors(client):
    id1 = _create_instructor(client, "강사A")
    id2 = _create_instructor(client, "강사B")
    client.post("/api/assignments", json={
        "course_date_id": "cd-1", "instructor_id": id1, "date": "2026-03-01",
    })
    resp = client.get("/api/instructors/available?date=2026-03-01")
    assert resp.status_code == 200
    available_ids = [i["id"] for i in resp.json()]
    assert id1 not in available_ids
    assert id2 in available_ids
