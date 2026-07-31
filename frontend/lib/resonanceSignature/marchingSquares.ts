export type Segment = readonly [readonly [number, number], readonly [number, number]];

function interpolate(a: number, b: number, level: number) {
  if (Math.abs(a - b) < 0.000001) return 0.5;
  return Math.max(0, Math.min(1, (level - a) / (b - a)));
}

export function marchingSquares(values: readonly number[], width: number, height: number, level: number): Segment[] {
  const segments: Segment[] = [];
  const at = (x: number, y: number) => values[y * width + x] ?? 0;
  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const tl = at(x, y);
      const tr = at(x + 1, y);
      const br = at(x + 1, y + 1);
      const bl = at(x, y + 1);
      const points: Array<readonly [number, number]> = [];
      if ((tl >= level) !== (tr >= level)) points.push([x + interpolate(tl, tr, level), y]);
      if ((tr >= level) !== (br >= level)) points.push([x + 1, y + interpolate(tr, br, level)]);
      if ((br >= level) !== (bl >= level)) points.push([x + 1 - interpolate(br, bl, level), y + 1]);
      if ((bl >= level) !== (tl >= level)) points.push([x, y + 1 - interpolate(bl, tl, level)]);
      if (points.length === 2) segments.push([points[0], points[1]]);
      if (points.length === 4) {
        segments.push([points[0], points[1]]);
        segments.push([points[2], points[3]]);
      }
    }
  }
  return segments.sort((left, right) => left[0][1] - right[0][1] || left[0][0] - right[0][0]);
}
