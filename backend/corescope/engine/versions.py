"""One source of truth for reproducibility metadata."""

from .contracts import EngineVersions

ENGINE_VERSION = "soulscope-engine-phase-a.1"
REGISTRY_VERSION = "soulscope-registry-phase-a.1"
FEATURE_VERSION = "soulscope-acoustic-features.1"
RULE_VERSION = "soulscope-rules-phase-a.1"

CURRENT_ENGINE_VERSIONS = EngineVersions(
    engine_version=ENGINE_VERSION,
    registry_version=REGISTRY_VERSION,
    feature_version=FEATURE_VERSION,
    rule_version=RULE_VERSION,
)
