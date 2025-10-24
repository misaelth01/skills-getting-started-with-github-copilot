import pytest
from fastapi import HTTPException
from src.app import activities

def test_get_activities(client):
    """Test the GET /activities endpoint"""
    response = client.get("/activities")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)
    # Verificar que tenemos al menos una actividad
    assert len(response.json()) > 0

def test_signup_for_activity_success(client):
    """Test successful signup for an activity"""
    # Usar una actividad existente (Chess Club)
    activity_name = "Chess Club"
    email = "newstudent@mergington.edu"
    
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    assert "Signed up" in response.json()["message"]
    
    # Verificar que el estudiante fue agregado
    activities_response = client.get("/activities")
    assert email in activities_response.json()[activity_name]["participants"]

def test_signup_for_nonexistent_activity(client):
    """Test signup for a non-existent activity"""
    response = client.post("/activities/NonexistentActivity/signup?email=test@mergington.edu")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_duplicate_signup(client):
    """Test signing up twice for the same activity"""
    activity_name = "Chess Club"
    email = "duplicate@mergington.edu"
    
    # Primera inscripción
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    
    # Intento de inscripción duplicada
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"].lower()

def test_unregister_from_activity_success(client):
    """Test successful unregistration from an activity"""
    activity_name = "Chess Club"
    email = "tounregister@mergington.edu"
    
    # Primero registramos al estudiante
    client.post(f"/activities/{activity_name}/signup?email={email}")
    
    # Ahora lo damos de baja
    response = client.post(f"/activities/{activity_name}/unregister?email={email}")
    assert response.status_code == 200
    assert "Unregistered" in response.json()["message"]
    
    # Verificar que el estudiante fue eliminado
    activities_response = client.get("/activities")
    assert email not in activities_response.json()[activity_name]["participants"]

def test_unregister_not_registered(client):
    """Test unregistering a student who is not registered"""
    response = client.post("/activities/Chess Club/unregister?email=notregistered@mergington.edu")
    assert response.status_code == 400
    assert "not signed up" in response.json()["detail"].lower()

def test_root_redirect(client):
    """Test that the root path redirects to static/index.html"""
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"

def test_activity_max_participants():
    """Test that activities have valid max_participants values"""
    for activity_name, details in activities.items():
        assert "max_participants" in details
        assert isinstance(details["max_participants"], int)
        assert details["max_participants"] > 0
        assert len(details["participants"]) <= details["max_participants"]