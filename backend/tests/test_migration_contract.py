from pathlib import Path


MIGRATION = Path(__file__).parents[2] / "supabase/migrations/20260724114403_add_canonical_acoustic_measurements.sql"


def test_acoustic_migration_declares_additive_contract_and_security_controls():
    sql = MIGRATION.read_text(encoding="utf-8").lower()
    for table in ("voice_audio_captures", "acoustic_feature_measurements", "personal_acoustic_baselines"):
        assert f"create table if not exists public.{table}" in sql
        assert f"alter table public.{table} enable row level security" in sql
        assert f"grant select, insert, update, delete on table public.{table} to authenticated" in sql
    for policy in ("select_own", "insert_own", "update_own", "delete_own"):
        assert f"voice_audio_captures_{policy}" in sql
        assert f"acoustic_feature_measurements_{policy}" in sql
        assert f"personal_acoustic_baselines_{policy}" in sql
    assert "references public.scan_sessions(id) on delete cascade" in sql
    assert "references auth.users(id) on delete cascade" in sql
    assert "personal_acoustic_baselines_unique_idx" in sql
    assert "exists (select 1 from public.scan_sessions" in sql


def test_migration_preserves_null_capable_measurement_and_baseline_values():
    sql = MIGRATION.read_text(encoding="utf-8").lower()
    assert "value double precision" in sql
    assert "rejection_reason text" in sql
    assert "center_value double precision" in sql
    assert "current_deviation double precision" in sql
    assert "baseline_window text not null check" in sql
