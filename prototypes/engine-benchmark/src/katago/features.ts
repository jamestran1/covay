// KataGo v7 input encoding, simplified from web-katrain (MIT, Copyright (c) 2026 Web KatRain Contributors),
// src/engine/katago/featuresV7.ts. See THIRD_PARTY.md.
//
// Simplifications for this benchmark (they change the net's answer a little, never its cost):
// - any board size (upstream is fixed at 19x19), tensor is exactly size x size;
// - rules fixed to Chinese (area scoring, simple ko, no suicide), komi 7.5;
// - no move history, no ko, no ladder and no pass-alive area planes (planes 6..21 stay 0).
// Planes kept: 0 on board, 1 own stones, 2 opponent stones, 3/4/5 groups with 1/2/3 liberties.

export const SPATIAL_CHANNELS = 22;
export const GLOBAL_CHANNELS = 19;

export type Player = 'black' | 'white';

/** Board as rows of '.', 'X' (black) and 'O' (white), row 0 at the top. */
export type Diagram = readonly string[];

export function parseDiagram(diagram: Diagram): Uint8Array {
  const size = diagram.length;
  const stones = new Uint8Array(size * size);
  diagram.forEach((row, y) => {
    if (row.length !== size) throw new Error(`Row ${y} has length ${row.length}, expected ${size}`);
    for (let x = 0; x < size; x++) {
      const c = row[x];
      stones[y * size + x] = c === 'X' ? 1 : c === 'O' ? 2 : 0;
    }
  });
  return stones;
}

export function encodeInputs(args: {
  stones: Uint8Array; // 0 empty, 1 black, 2 white; length size*size
  size: number;
  toMove: Player;
  komi?: number;
}): { spatial: Float32Array; global: Float32Array } {
  const { stones, size, toMove } = args;
  const komi = args.komi ?? 7.5;
  const area = size * size;
  const own = toMove === 'black' ? 1 : 2;
  const spatial = new Float32Array(area * SPATIAL_CHANNELS);
  const global = new Float32Array(GLOBAL_CHANNELS);
  const at = (pos: number, c: number) => pos * SPATIAL_CHANNELS + c;

  for (let pos = 0; pos < area; pos++) {
    spatial[at(pos, 0)] = 1;
    const s = stones[pos];
    if (s === 0) continue;
    spatial[at(pos, s === own ? 1 : 2)] = 1;
  }

  // Liberty planes 3,4,5: stones in groups with exactly 1, 2, 3 liberties.
  const visited = new Uint8Array(area);
  const libMark = new Uint8Array(area);
  for (let start = 0; start < area; start++) {
    const color = stones[start];
    if (color === 0 || visited[start]) continue;
    const stack = [start];
    const group: number[] = [start];
    const libs: number[] = [];
    visited[start] = 1;
    while (stack.length > 0) {
      const p = stack.pop()!;
      const x = p % size;
      const y = (p / size) | 0;
      const neighbors: number[] = [];
      if (x > 0) neighbors.push(p - 1);
      if (x + 1 < size) neighbors.push(p + 1);
      if (y > 0) neighbors.push(p - size);
      if (y + 1 < size) neighbors.push(p + size);
      for (const n of neighbors) {
        if (stones[n] === 0) {
          if (!libMark[n]) {
            libMark[n] = 1;
            libs.push(n);
          }
        } else if (stones[n] === color && !visited[n]) {
          visited[n] = 1;
          stack.push(n);
          group.push(n);
        }
      }
    }
    for (const l of libs) libMark[l] = 0;
    const plane = libs.length === 1 ? 3 : libs.length === 2 ? 4 : libs.length === 3 ? 5 : -1;
    if (plane >= 0) for (const g of group) spatial[at(g, plane)] = 1;
  }

  // Globals: komi from the mover's view, Chinese rules leave the rule flags at 0,
  // and area scoring turns on the komi parity wave (KataGo fillRowV7).
  const selfKomi = toMove === 'white' ? komi : -komi;
  global[5] = selfKomi / 20;
  const drawableKomisAreEven = area % 2 === 0;
  const komiFloor = drawableKomisAreEven
    ? Math.floor(selfKomi / 2) * 2
    : Math.floor((selfKomi - 1) / 2) * 2 + 1;
  const delta = Math.min(2, Math.max(0, selfKomi - komiFloor));
  global[18] = delta < 0.5 ? delta : delta < 1.5 ? 1 - delta : delta - 2;

  return { spatial, global };
}
