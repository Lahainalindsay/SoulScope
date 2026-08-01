export const TAU = Math.PI * 2;

export function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

export function clampSigned(value: number) {
  return clamp(value, -1, 1);
}

export function round(value: number, places = 6) {
  return Number(value.toFixed(places));
}

export function mean(values: readonly number[]) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? finite.reduce((sum, value) => sum + value, 0) / finite.length : 0;
}

export function spread(values: readonly number[]) {
  if (!values.length) return 0;
  const average = mean(values);
  return mean(values.map((value) => Math.abs(value - average)));
}

export function angleDistance(left: number, right: number) {
  return Math.atan2(Math.sin(left - right), Math.cos(left - right));
}

export function sha256Like(input: string) {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code + index;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
}
