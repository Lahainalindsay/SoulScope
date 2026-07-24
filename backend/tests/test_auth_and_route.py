import asyncio
import io
from fastapi import UploadFile

import pytest

import main


class FakeResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class FakeClient:
    response = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def get(self, *args, **kwargs):
        return self.response


def run(coroutine):
    return asyncio.run(coroutine)


def test_missing_bearer_token_is_rejected(monkeypatch):
    monkeypatch.setattr(main, "REQUIRE_SUPABASE_AUTH", True)
    with pytest.raises(main.HTTPException) as error:
        run(main._authenticate_user(None))
    assert error.value.status_code == 401


@pytest.mark.parametrize("status", [401, 403])
def test_invalid_expired_or_bad_signature_tokens_are_rejected_by_supabase(monkeypatch, status):
    monkeypatch.setattr(main, "REQUIRE_SUPABASE_AUTH", True)
    monkeypatch.setattr(main, "SUPABASE_URL", "https://project.supabase.co")
    monkeypatch.setattr(main, "SUPABASE_ANON_KEY", "publishable-test-key")
    FakeClient.response = FakeResponse(status, {"error": "invalid token"})
    monkeypatch.setattr(main.httpx, "AsyncClient", lambda **kwargs: FakeClient())
    with pytest.raises(main.HTTPException) as error:
        run(main._authenticate_user("Bearer invalid-or-expired"))
    assert error.value.status_code == 401


def test_authenticated_identity_is_taken_from_supabase_not_client_metadata(monkeypatch):
    monkeypatch.setattr(main, "REQUIRE_SUPABASE_AUTH", True)
    monkeypatch.setattr(main, "SUPABASE_URL", "https://project.supabase.co")
    monkeypatch.setattr(main, "SUPABASE_ANON_KEY", "publishable-test-key")
    FakeClient.response = FakeResponse(200, {"id": "user-from-supabase"})
    monkeypatch.setattr(main.httpx, "AsyncClient", lambda **kwargs: FakeClient())
    assert run(main._authenticate_user("Bearer valid")) == "user-from-supabase"


def test_scan_ownership_rejects_cross_user_scan(monkeypatch):
    monkeypatch.setattr(main, "REQUIRE_SUPABASE_AUTH", True)
    monkeypatch.setattr(main, "SUPABASE_URL", "https://project.supabase.co")
    monkeypatch.setattr(main, "SUPABASE_ANON_KEY", "publishable-test-key")
    FakeClient.response = FakeResponse(200, [{"id": "scan-1", "user_id": "different-user"}])
    monkeypatch.setattr(main.httpx, "AsyncClient", lambda **kwargs: FakeClient())
    with pytest.raises(main.HTTPException) as error:
        run(main._verify_scan_ownership("scan-1", "authenticated-user", "Bearer valid"))
    assert error.value.status_code == 403


def test_scan_ownership_accepts_only_matching_scan_user(monkeypatch):
    monkeypatch.setattr(main, "REQUIRE_SUPABASE_AUTH", True)
    monkeypatch.setattr(main, "SUPABASE_URL", "https://project.supabase.co")
    monkeypatch.setattr(main, "SUPABASE_ANON_KEY", "publishable-test-key")
    captured = {}

    class OwnershipClient(FakeClient):
        async def get(self, url, **kwargs):
            captured.update({"url": url, **kwargs})
            return FakeResponse(200, [{"id": "scan-1", "user_id": "authenticated-user"}])

    monkeypatch.setattr(main.httpx, "AsyncClient", lambda **kwargs: OwnershipClient())
    run(main._verify_scan_ownership("scan-1", "authenticated-user", "Bearer valid"))
    assert captured["headers"]["Authorization"] == "Bearer valid"
    assert captured["params"]["select"] == "id,user_id"


def test_route_requires_scan_ownership_before_analysis(monkeypatch):
    calls = []

    async def authenticate(_authorization):
        return "authenticated-user"

    async def ownership(scan_id, user_id, authorization):
        calls.append((scan_id, user_id, authorization))
        raise main.HTTPException(status_code=403, detail="Scan is not owned by the authenticated user")

    monkeypatch.setattr(main, "_authenticate_user", authenticate)
    monkeypatch.setattr(main, "_verify_scan_ownership", ownership)
    file = UploadFile(file=io.BytesIO(b"audio"), filename="capture.wav")
    with pytest.raises(main.HTTPException) as error:
        run(main.analyze_voice_audio(file=file, scan_id="other-scan", source_capture_id="capture-1", capture_kind="guided_speech", authorization="Bearer user-token"))
    assert error.value.status_code == 403
    assert calls == [("other-scan", "authenticated-user", "Bearer user-token")]


def test_browser_code_contains_no_service_role_secret():
    source = open("frontend/lib/serverAcousticAnalysis.ts", encoding="utf-8").read()
    assert "service_role" not in source.lower()
    assert "SUPABASE_SERVICE_ROLE" not in source


def test_auth_and_audio_are_not_logged_by_route_source():
    source = open("backend/main.py", encoding="utf-8").read()
    assert "print(" not in source
    assert "logging." not in source
    assert "upload_bytes" not in source.split("analyze_voice_audio", 1)[1].split("class PhysioSample", 1)[0].replace("upload_bytes", "")
