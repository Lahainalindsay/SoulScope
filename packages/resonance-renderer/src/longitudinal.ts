import { buildStrokeLayers, extractContours } from "./contours";
import { buildScalarField } from "./field";
import { clamp, round } from "./math";
import type { RendererInput, ScalarField } from "./types";

function accumulateFields(fields: readonly ScalarField[]): ScalarField {
  const first = fields[0];
  const values = first.values.map((_, index) => {
    const samples = fields.map((field, fieldIndex) => field.values[index] * (0.72 + fieldIndex / Math.max(1, fields.length - 1) * 0.28));
    const repeated = samples.reduce((sum, value) => sum + value, 0) / fields.length;
    const stability = 1 - Math.min(1, Math.max(...samples) - Math.min(...samples));
    return round(clamp(repeated * (0.82 + stability * 0.28)));
  });
  return Object.freeze({
    ...first,
    values: Object.freeze(values),
    checksum: `longitudinal:${fields.map((field) => field.checksum).join(":")}`,
  });
}

export function accumulateLongitudinalGeometry(inputs: readonly RendererInput[]) {
  if (!inputs.length) throw new Error("At least one signature input is required for longitudinal accumulation.");
  const fields = inputs.map((input) => buildScalarField(input));
  const field = accumulateFields(fields);
  const latest = inputs[inputs.length - 1];
  const contours = extractContours(latest, field);
  const strokes = buildStrokeLayers(contours).map((stroke) => Object.freeze({
    ...stroke,
    width: round(stroke.width * 1.12, 3),
    opacity: round(clamp(stroke.opacity * 1.16), 3),
  }));
  return Object.freeze({ input: latest, field, contours, strokes });
}
