import type { Diagram, Player } from './katago/features';

export type BenchPosition = {
  name: string;
  size: number;
  toMove: Player;
  diagram: Diagram;
};

const empty = (size: number): Diagram => Array.from({ length: size }, () => '.'.repeat(size));

// 30 stones, black to move, a tactical fight. Black G3 is in atari and the white G2
// stone that cuts it has two liberties, H2 and G1; white D4 is in atari at C4.
// A net with sane inputs ranks local fighting moves (H2 / G1 / C4) high, never far-off
// first-row points. Measured on WASM and WebGPU: H2 32%, B2 22%, G1 9%.
const midgame9: Diagram = [
  '.........',
  '..O.X....',
  '.OXX.X.O.',
  '.OOX..XO.',
  '..OXXXOO.',
  '.O.OX.O..',
  '..OXX.XO.',
  '...X.XO..',
  '.........',
];

// 37 stones, white to move: a fuseki with corner approaches and a few side stones.
const midgame19: Diagram = [
  '...................',
  '...................',
  '..O.X.......O..X...',
  '...X.....O...O.X...',
  '..OX..........OX...',
  '..O..........O.X...',
  '...............O...',
  '...................',
  '..O...........X....',
  '...X.....X.........',
  '...................',
  '..X.............O..',
  '...................',
  '..O..............X.',
  '..OX.........X.....',
  '..O.X.......O..X...',
  '..OX.X.......OX....',
  '...O...............',
  '...................',
];

export const POSITIONS: Record<9 | 19, { empty: BenchPosition; midgame: BenchPosition }> = {
  9: {
    empty: { name: 'Bàn trống 9x9', size: 9, toMove: 'black', diagram: empty(9) },
    midgame: { name: 'Giữa ván 9x9', size: 9, toMove: 'black', diagram: midgame9 },
  },
  19: {
    empty: { name: 'Bàn trống 19x19', size: 19, toMove: 'black', diagram: empty(19) },
    midgame: { name: 'Giữa ván 19x19', size: 19, toMove: 'white', diagram: midgame19 },
  },
};

/** GTP style coordinate: columns A..T without I, rows counted from the bottom. */
export function gtpCoord(x: number, y: number, size: number): string {
  const letters = 'ABCDEFGHJKLMNOPQRST';
  return `${letters[x]}${size - y}`;
}
