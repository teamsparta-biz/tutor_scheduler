def test_create_instructor(client):
    resp = client.post("/api/instructors", json={
        "name": "김강사",
        "email": "kim@example.com",
        "specialty": "Python",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "김강사"
    assert data["email"] == "kim@example.com"
    assert data["is_active"] is True
    assert "id" in data


def test_list_instructors(client):
    client.post("/api/instructors", json={"name": "A"})
    client.post("/api/instructors", json={"name": "B"})
    resp = client.get("/api/instructors")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_list_instructors_filter_active(client):
    client.post("/api/instructors", json={"name": "Active", "is_active": True})
    client.post("/api/instructors", json={"name": "Inactive", "is_active": False})
    resp = client.get("/api/instructors?is_active=true")
    assert resp.status_code == 200
    names = [i["name"] for i in resp.json()]
    assert "Active" in names
    assert "Inactive" not in names


def test_get_instructor(client):
    create_resp = client.post("/api/instructors", json={"name": "김강사"})
    instructor_id = create_resp.json()["id"]
    resp = client.get(f"/api/instructors/{instructor_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "김강사"


def test_get_instructor_not_found(client):
    resp = client.get("/api/instructors/nonexistent-id")
    assert resp.status_code == 404


def test_update_instructor(client):
    create_resp = client.post("/api/instructors", json={"name": "김강사"})
    instructor_id = create_resp.json()["id"]
    resp = client.put(f"/api/instructors/{instructor_id}", json={"name": "이강사"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "이강사"


def test_update_instructor_not_found(client):
    resp = client.put("/api/instructors/nonexistent-id", json={"name": "이강사"})
    assert resp.status_code == 404


def test_delete_instructor(client):
    create_resp = client.post("/api/instructors", json={"name": "삭제대상"})
    instructor_id = create_resp.json()["id"]
    resp = client.delete(f"/api/instructors/{instructor_id}")
    assert resp.status_code == 204

    resp = client.get(f"/api/instructors/{instructor_id}")
    assert resp.status_code == 404


def test_delete_instructor_not_found(client):
    resp = client.delete("/api/instructors/nonexistent-id")
    assert resp.status_code == 404
