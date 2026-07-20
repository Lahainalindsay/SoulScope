import { describe, expect, it } from "vitest";
import { resolveAtlasProfile } from "../lib/patternAtlas";

describe("Pattern Atlas", () => {
  it("separates overextension from grounded regulation", () => {
    const loaded = resolveAtlasProfile({
      "sustained-effort": 0.95,
      "reduced-recovery": 0.94,
      "cognitive-searching": 0.72,
      "steady-regulation": 0.58,
    });
    const grounded = resolveAtlasProfile({
      "grounded-presence": 0.95,
      "steady-regulation": 0.92,
      "directional-clarity": 0.82,
      "adaptive-momentum": 0.78,
      "reduced-recovery": 0.08,
    });

    expect(loaded.profile.id).not.toBe(grounded.profile.id);
    expect(["overextended-steward", "quietly-overloaded"]).toContain(loaded.profile.id);
    expect(["grounded-navigator", "steady-supporter"]).toContain(grounded.profile.id);
  });

  it("distinguishes protective expression from open expression", () => {
    const protectedResult = resolveAtlasProfile({
      "protective-restraint": 0.95,
      "cognitive-searching": 0.7,
      "social-availability": 0.42,
      "steady-regulation": 0.62,
    });
    const openResult = resolveAtlasProfile({
      "expressive-flexibility": 0.92,
      "social-availability": 0.9,
      "steady-regulation": 0.78,
      "protective-restraint": 0.05,
    });

    expect(["reflective-protector", "contained-communicator"]).toContain(protectedResult.profile.id);
    expect(openResult.profile.id).toBe("open-integrator");
  });

  it("returns two alternative profiles based on the same evidence graph", () => {
    const result = resolveAtlasProfile({
      "returning-capacity": 0.9,
      "steady-regulation": 0.68,
      "adaptive-momentum": 0.62,
      "reduced-recovery": 0.35,
    });

    expect(result.supporting).toHaveLength(2);
    expect(new Set([result.profile.id, ...result.supporting.map((entry) => entry.profile.id)]).size).toBe(3);
    expect(result.subpatterns.length).toBeGreaterThanOrEqual(3);
  });
});
