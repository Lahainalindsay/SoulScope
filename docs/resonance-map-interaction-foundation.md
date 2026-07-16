# Resonance Map interaction foundation

The Resonance Map now accepts an optional typed `interactionRegions` model. Interactions remain disabled by default.

A region may reference only an existing deterministic entity:

- domain
- observation
- evidence signal
- note-energy region

Each region can carry a name, plain-language description, confidence/context, and recent movement. The current map enables a region only when `interactionsEnabled` is true, a matching entity mapping exists, and an `onRegionSelect` handler is supplied.

## Required before enabling interactions

1. Build mappings from persisted scan entities to exact visual regions.
2. Confirm that every visible hotspot represents one traceable stored entity.
3. Add accessible selected-state and detail-panel behavior.
4. Validate the same mapping across mobile and desktop rendering.
5. Add tests preventing unlabeled or inferred hotspots.

No hotspots are enabled in this phase, and no new meaning is assigned to the map.
